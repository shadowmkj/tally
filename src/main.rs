use std::fs;

use bollard::{API_DEFAULT_VERSION, Docker};
use clap::Parser;
use crust::models::{Language, TestCase};
use crust::runner;

#[derive(Parser, Debug)]
#[command(version, about)]
struct Cli {
    /// Submission language.
    #[arg(value_enum)]
    language: Language,

    /// The method/function name to invoke on the Solution class.
    #[arg(default_value = "twoSum")]
    method_name: String,

    /// Path to the solution source file (e.g. solution.py, Solution.java).
    #[arg(short, long)]
    code: String,

    /// Path to the JSON file containing test cases.
    #[arg(short, long, default_value = "two_sum.jsonl")]
    tests: String,

    /// Docker socket path.
    #[arg(long, default_value = "unix:///Users/milan/.docker/run/docker.sock")]
    docker_socket: String,
}

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let cli = Cli::parse();

    let docker = Docker::connect_with_unix(&cli.docker_socket, 120, API_DEFAULT_VERSION)?;
    println!("Successfully connected to Docker daemon.");

    // Read the user's solution source code
    let solution_code = std::fs::read_to_string(&cli.code)
        .map_err(|e| anyhow::anyhow!("Failed to read solution file '{}': {}", cli.code, e))?;
    let solution_code = prepare_solution_file(&solution_code, &cli.language);
    // Read test cases from JSON file
    let tests_path = std::path::Path::new("code_tests");
    let tests_file = tests_path.join(&cli.tests);
    let test_cases: Vec<TestCase> = serde_json::from_reader(std::fs::File::open(tests_file)?)?;

    // Run the execution pipeline
    for test_case in test_cases {
        println!("Executing Test Case ID: {}", test_case.id);
        match runner::execute_submission(
            &docker,
            test_case,
            &cli.language,
            &cli.method_name,
            &solution_code,
        )
        .await
        {
            Ok(verdict) => println!("{}", verdict),
            Err(e) => eprintln!("Error executing test case: {}", e),
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
