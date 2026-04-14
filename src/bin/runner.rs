use std::fs;

use bollard::{API_DEFAULT_VERSION, Docker};
use clap::Parser;
use crust::models::{Job, Language, TestCase, Verdict};
use crust::runner;
use redis::AsyncCommands;

#[derive(Parser, Debug)]
#[command(version, about)]
struct Cli {
    /// Submission language.
    #[arg(value_enum, required_unless_present = "listen_queue")]
    language: Option<Language>,

    /// The method/function name to invoke on the Solution class.
    #[arg(default_value = "twoSum")]
    method_name: String,

    /// Path to the solution source file (e.g. solution.py, Solution.java).
    #[arg(short, long, required_unless_present = "listen_queue")]
    code: Option<String>,

    /// Path to the JSON file containing test cases.
    #[arg(short, long, default_value = "two_sum.jsonl")]
    tests: String,

    /// Docker socket path.
    #[arg(long, default_value = "unix:///Users/milan/.docker/run/docker.sock")]
    docker_socket: String,

    /// Redis URL to connect to.
    #[arg(long, env = "REDIS_URL", default_value = "redis://127.0.0.1/")]
    redis_url: String,

    /// Redis queue to listen to for jobs.
    #[arg(long)]
    listen_queue: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let cli = Cli::parse();

    let docker = Docker::connect_with_unix(&cli.docker_socket, 120, API_DEFAULT_VERSION)?;
    println!("Successfully connected to Docker daemon.");

    if let Some(queue) = cli.listen_queue {
        println!("Starting in listener mode on queue '{}'", queue);
        let client = redis::Client::open(cli.redis_url)?;
        loop {
            let mut con = match client.get_multiplexed_async_connection().await {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Failed to connect to Redis: {:?}", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                    continue;
                }
            };
            println!("Connected to Redis. Waiting for jobs...");

            loop {
                // Poll the queue with RPOP instead of BRPOP to prevent blocking the multiplexer task
                let result: redis::RedisResult<Option<String>> = con.rpop(&queue, None).await;
                match result {
                    Ok(Some(payload)) => {
                        println!("Received job payload: {}", payload);
                        if let Ok(job) = serde_json::from_str::<Job>(&payload) {
                            println!("Processing job {} / {}", job.problem_id, job.problem_slug);

                            let solution_code = prepare_solution_file(&job.code, &job.language);

                            // Read test cases from JSON file
                            let tests_path = std::path::Path::new("code_tests");
                            let tests_file = tests_path.join(format!("{}.jsonl", job.problem_slug));
                            let test_cases: Vec<TestCase> = match fs::File::open(&tests_file) {
                                Ok(file) => {
                                    serde_json::from_reader(file).unwrap_or_else(|_| vec![])
                                }
                                Err(e) => {
                                    eprintln!(
                                        "Failed to load test cases from {:?}: {}",
                                        tests_file, e
                                    );
                                    continue;
                                }
                            };

                            if test_cases.is_empty() {
                                println!("No test cases found for {}", job.problem_slug);
                                continue;
                            }

                            match runner::run_all(
                                &docker,
                                test_cases,
                                &job.language,
                                &job.method_name,
                                &solution_code,
                            )
                            .await
                            {
                                Ok(results) => {
                                    let total = results.len();
                                    let passed = results
                                        .iter()
                                        .filter(|r| r.verdict == Verdict::Accepted)
                                        .count();
                                    println!(
                                        "Job {}: {}/{} test cases passed.",
                                        job.problem_id, passed, total
                                    );
                                    for result in &results {
                                        println!("  Test Case {}: {}", result.id, result.verdict);
                                    }
                                }
                                Err(e) => {
                                    eprintln!("Error running job {}: {:?}", job.problem_id, e);
                                }
                            }
                        } else {
                            eprintln!("Failed to parse job payload");
                        }
                    }
                    Ok(None) => {
                        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                        continue;
                    }
                    Err(e) => {
                        eprintln!("Redis error: {:?}", e);
                        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                        break;
                    }
                }
            }
        } // Close outer loop
    } else {
        let language = cli
            .language
            .expect("language is required when not listening");
        let code_path = cli.code.expect("code is required when not listening");

        // Read the user's solution source code
        let solution_code = fs::read_to_string(&code_path)
            .map_err(|e| anyhow::anyhow!("Failed to read solution file '{}': {}", code_path, e))?;
        let solution_code = prepare_solution_file(&solution_code, &language);

        // Read test cases from JSON file
        let tests_path = std::path::Path::new("code_tests");
        let tests_file = tests_path.join(&cli.tests);
        let test_cases: Vec<TestCase> = serde_json::from_reader(fs::File::open(tests_file)?)?;

        // Run all test cases in a single container
        let results = runner::run_all(
            &docker,
            test_cases,
            &language,
            &cli.method_name,
            &solution_code,
        )
        .await?;

        // Print results
        for result in &results {
            println!("Test Case {}: {}", result.id, result.verdict);
        }

        // Summary
        let total = results.len();
        let passed = results
            .iter()
            .filter(|r| r.verdict == Verdict::Accepted)
            .count();
        if passed == total {
            println!("\n🎉 All {} test cases passed!", total);
        } else {
            println!(
                "\n💥 {}/{} test cases passed. Stopped at first failure.",
                passed, total
            );
        }
    }

    Ok(())
}

fn prepare_solution_file(user_code: &str, language: &Language) -> String {
    let prelude = match language {
        Language::Python => {
            "\
from typing import *
from collections import *
import math
import heapq
import bisect
import itertools
"
        }
        Language::Java => {
            "\
import java.util.*;
        "
        }
    };
    format!("{}{}", prelude, user_code)
}
