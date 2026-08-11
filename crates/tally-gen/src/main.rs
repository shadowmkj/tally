// ==============================================================================
// Tally Test Case Generator (`tally-gen`) Main Entry Point
// ==============================================================================

// This binary drives CLI option parsing, triggers the testcase generation pipeline,
// and invokes the appropriate format exporter (JSONL, Single, or Directory).

mod cli;
mod exporter;
mod generator;
mod pipeline;
mod types;

use anyhow::Result;
use clap::Parser;
use cli::Cli;
use exporter::export_test_suite;
use pipeline::generate_test_suite;

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    let suite = generate_test_suite(
        &cli.generator,
        &cli.reference,
        &cli.method,
        cli.tests,
        cli.sample_cases,
        cli.seed,
    )
    .await?;

    export_test_suite(&suite, &cli.output, cli.format)?;

    Ok(())
}

// ==============================================================================
// Unit Test Suites: CLI Argument Parsing & Exporters
// ==============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use types::{GeneratedTestCase, OutputFormat};

    #[test]
    fn test_cli_argument_parsing() {
        let args = vec![
            "tally-gen",
            "--generator",
            "gen.py",
            "--reference",
            "sol.py",
            "--method",
            "solve",
            "--tests",
            "50",
            "--seed",
            "123",
            "--sample-cases",
            "3",
            "--output",
            "output.jsonl",
            "--format",
            "jsonl",
        ];

        let cli = Cli::try_parse_from(args).expect("failed to parse CLI arguments");

        assert_eq!(cli.generator, "gen.py");
        assert_eq!(cli.reference, "sol.py");
        assert_eq!(cli.method, "solve");
        assert_eq!(cli.tests, 50);
        assert_eq!(cli.seed, 123);
        assert_eq!(cli.sample_cases, 3);
        assert_eq!(cli.output, "output.jsonl");
        assert_eq!(cli.format, OutputFormat::Jsonl);
    }

    #[test]
    fn test_export_jsonl_format() {
        let temp_dir = tempfile::tempdir().expect("failed to create temp dir");
        let output_path = temp_dir.path().join("test.jsonl");

        let suite = vec![
            GeneratedTestCase {
                id: 1,
                input: json!({"n": 1}),
                expected: json!(1),
                is_hidden: false,
                explanation: None,
            },
            GeneratedTestCase {
                id: 2,
                input: json!({"n": 2}),
                expected: json!(2),
                is_hidden: true,
                explanation: None,
            },
        ];

        let res = export_test_suite(&suite, output_path.to_str().unwrap(), OutputFormat::Jsonl);
        assert!(res.is_ok(), "JSONL export failed");

        let content = std::fs::read_to_string(&output_path).expect("failed to read exported JSONL");
        assert!(content.starts_with("["));
        assert!(content.contains("\"id\": 1"));
        assert!(content.contains("\"id\": 2"));
    }

    #[test]
    fn test_export_single_file_format() {
        let temp_dir = tempfile::tempdir().expect("failed to create temp dir");
        let output_path = temp_dir.path().join("input.txt");

        let suite = vec![
            GeneratedTestCase {
                id: 1,
                input: json!({"nums": [1, 2]}),
                expected: json!(3),
                is_hidden: false,
                explanation: None,
            },
            GeneratedTestCase {
                id: 2,
                input: json!({"nums": [3, 4]}),
                expected: json!(7),
                is_hidden: true,
                explanation: None,
            },
        ];

        let res = export_test_suite(&suite, output_path.to_str().unwrap(), OutputFormat::Single);
        assert!(res.is_ok(), "Single file export failed");

        let content = std::fs::read_to_string(&output_path).expect("failed to read single file");
        assert!(content.starts_with("2\n"));
        assert!(content.contains("{\"nums\":[1,2]}"));
    }

    #[test]
    fn test_export_dir_format() {
        let temp_dir = tempfile::tempdir().expect("failed to create temp dir");
        let output_dir = temp_dir.path().join("test_dir");

        let suite = vec![
            GeneratedTestCase {
                id: 1,
                input: json!({"n": 5}),
                expected: json!(25),
                is_hidden: false,
                explanation: None,
            },
        ];

        let res = export_test_suite(&suite, output_dir.to_str().unwrap(), OutputFormat::Dir);
        assert!(res.is_ok(), "Directory export failed");

        assert!(output_dir.join("01.in").exists());
        assert!(output_dir.join("01.out").exists());

        let in_content = std::fs::read_to_string(output_dir.join("01.in")).unwrap();
        let out_content = std::fs::read_to_string(output_dir.join("01.out")).unwrap();
        assert!(in_content.contains("\"n\": 5"));
        assert_eq!(out_content.trim(), "25");
    }
}
