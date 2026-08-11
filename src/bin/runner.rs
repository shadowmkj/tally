use std::fs;

use clap::Parser;
use redis::AsyncCommands;
use tally::models::{Job, Language, TestCase, Verdict};
use tally::runner;

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

    /// Optional type schema for languages like C (e.g. "[i],i:[i]")
    #[arg(long)]
    type_schema: Option<String>,

    /// Path to the JSON file containing test cases.
    #[arg(short, long, default_value = "two_sum.jsonl")]
    tests: String,

    /// Docker socket path.
    #[arg(
        long,
        env = "DOCKER_HOST",
        default_value = "unix:///var/run/docker.sock"
    )]
    docker_socket: String,

    /// Redis URL to connect to.
    #[arg(long, env = "REDIS_URL", default_value = "redis://127.0.0.1/")]
    redis_url: String,

    /// Redis queue to listen to for jobs.
    #[arg(long)]
    listen_queue: Option<String>,

    /// Path to SQLite database file.
    #[arg(long, env = "SQLITE_PATH", default_value = "frontend/dev.db")]
    sqlite_path: String,
}

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let cli = Cli::parse();

    let sqlite_conn = tally::db::connect(&cli.sqlite_path)?;
    println!(
        "Successfully connected to SQLite database at '{}'.",
        cli.sqlite_path
    );

    let docker = runner::create_docker_client(&cli.docker_socket)?;
    runner::verify_docker_connection(&docker, &cli.docker_socket).await?;
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

                            let solution_code =
                                runner::prepare_solution_file(&job.code, &job.language);

                            // Read test cases from JSON file
                            let tests_path = std::path::Path::new("code_tests");
                            let test_filename = match &job.test_file {
                                Some(f) if !f.trim().is_empty() => f.trim().to_string(),
                                _ => format!("{}.jsonl", job.problem_slug),
                            };
                            let tests_file = tests_path.join(&test_filename);
                            let test_cases: Vec<TestCase> = match fs::File::open(&tests_file) {
                                Ok(file) => match serde_json::from_reader(file) {
                                    Ok(cases) => cases,
                                    Err(e) => {
                                        let err_msg = format!(
                                            "Failed to parse test cases file {:?}: {}",
                                            tests_file, e
                                        );
                                        eprintln!("{}", err_msg);
                                        let _ = tally::db::update_submission_error(
                                            &sqlite_conn,
                                            &job,
                                            "System Error",
                                            &err_msg,
                                        );
                                        continue;
                                    }
                                },
                                Err(e) => {
                                    let err_msg = format!(
                                        "Failed to load test cases file {:?}: {}",
                                        tests_file, e
                                    );
                                    eprintln!("{}", err_msg);
                                    let _ = tally::db::update_submission_error(
                                        &sqlite_conn,
                                        &job,
                                        "System Error",
                                        &err_msg,
                                    );
                                    continue;
                                }
                            };

                            if test_cases.is_empty() {
                                let err_msg =
                                    format!("No test cases found for {}", job.problem_slug);
                                eprintln!("{}", err_msg);
                                let _ = tally::db::update_submission_error(
                                    &sqlite_conn,
                                    &job,
                                    "System Error",
                                    &err_msg,
                                );
                                continue;
                            }

                            // Record total testcase count prior to moving `test_cases` vector into `run_all`.
                            // This ensures the database update receives the full dataset count even if execution stops early.
                            let total_test_cases = test_cases.len();

                            match runner::run_all(
                                &docker,
                                test_cases,
                                &job.language,
                                &job.method_name,
                                job.type_schema.as_deref(),
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

                                    match tally::db::update_submission_status(
                                        &sqlite_conn,
                                        &job,
                                        &results,
                                        total_test_cases,
                                    ) {
                                        Ok(Some(sub_id)) => {
                                            println!(
                                                "Updated SQLite submission '{}' status.",
                                                sub_id
                                            );
                                        }
                                        Ok(None) => {
                                            println!(
                                                "No matching submission found in SQLite database to update."
                                            );
                                        }
                                        Err(e) => {
                                            eprintln!(
                                                "Failed to update SQLite submission: {:?}",
                                                e
                                            );
                                        }
                                    }

                                    for result in &results {
                                        println!("  Test Case {}: {}", result.id, result.verdict);
                                    }
                                }
                                Err(e) => {
                                    let err_msg = format!("System Error: {:#}", e);
                                    eprintln!("Error running job {}: {}", job.problem_id, err_msg);
                                    match tally::db::update_submission_error(
                                        &sqlite_conn,
                                        &job,
                                        "System Error",
                                        &err_msg,
                                    ) {
                                        Ok(Some(sub_id)) => {
                                            println!(
                                                "Updated SQLite submission '{}' to System Error.",
                                                sub_id
                                            );
                                        }
                                        Ok(None) => {
                                            eprintln!(
                                                "No matching submission found in SQLite database to update error status."
                                            );
                                        }
                                        Err(db_err) => {
                                            eprintln!(
                                                "Failed to update SQLite submission error: {:?}",
                                                db_err
                                            );
                                        }
                                    }
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
        let solution_code = runner::prepare_solution_file(&solution_code, &language);

        // Read test cases from JSON file
        let tests_path = std::path::Path::new("code_tests");
        let tests_file = tests_path.join(&cli.tests);
        let test_cases: Vec<TestCase> = serde_json::from_reader(fs::File::open(tests_file)?)?;
        let total_test_cases = test_cases.len();

        // Run all test cases in a single container
        let results = runner::run_all(
            &docker,
            test_cases,
            &language,
            &cli.method_name,
            cli.type_schema.as_deref(),
            &solution_code,
        )
        .await?;

        // Print results
        for result in &results {
            println!("Test Case {}: {}", result.id, result.verdict);
        }

        // Summary
        let passed = results
            .iter()
            .filter(|r| r.verdict == Verdict::Accepted)
            .count();
        if passed == total_test_cases {
            println!("\n🎉 All {} test cases passed!", total_test_cases);
        } else {
            println!(
                "\n💥 {}/{} test cases passed. Stopped at first failure.",
                passed, total_test_cases
            );
        }
    }

    Ok(())
}
