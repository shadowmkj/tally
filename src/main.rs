use bollard::{API_DEFAULT_VERSION, Docker};
use crust::models::{Language, TestCase};
use crust::runner;


#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: {} <language> [method_name]", args[0]);
        eprintln!("  language: python | java");
        std::process::exit(1);
    }

    let language = match args[1].as_str() {
        "python" => Language::Python,
        "java" => Language::Java,
        other => {
            eprintln!("Unsupported language: {}", other);
            std::process::exit(1);
        }
    };

    let method_name = args.get(2).map(String::as_str).unwrap_or("twoSum");

    // Explicitly connect to Docker Desktop's Unix socket instead of the
    // system-wide /var/run/docker.sock symlink (which may point to Podman).
    let docker = Docker::connect_with_unix(
        "unix:///Users/milan/.docker/run/docker.sock",
        120,
        API_DEFAULT_VERSION,
    )?;

    println!("Successfully connected to Docker daemon.");

    // Read test cases from JSON file
    let test_cases: Vec<TestCase> =
        serde_json::from_str(&std::fs::read_to_string("two_sum.jsonl")?)?;

    // Run the execution pipeline
    for test_case in test_cases {
        println!("Executing Test Case ID: {}", test_case.id);
        match runner::execute_submission(&docker, test_case, &language, method_name, None).await {
            Ok(verdict) => println!("{}", verdict),
            Err(e) => eprintln!("Error executing test case: {}", e),
        }
    }

    Ok(())
}
