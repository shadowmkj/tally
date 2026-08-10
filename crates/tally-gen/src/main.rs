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
    use types::{GeneratedTestCase, OutputFormat};

    #[test]
    fn test_cli_argument_parsing() {
        let args = vec![
            "tally-gen",
            "--generator",
            "gen.py",
            "--reference",
            "sol.py",
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
                id: "tc-1".to_string(),
                input: "5\n".to_string(),
                expected: "10\n".to_string(),
                is_hidden: false,
            },
            GeneratedTestCase {
                id: "tc-2".to_string(),
                input: "10\n".to_string(),
                expected: "20\n".to_string(),
                is_hidden: true,
            },
        ];

        let res = export_test_suite(&suite, output_path.to_str().unwrap(), OutputFormat::Jsonl);
        assert!(res.is_ok(), "JSONL export failed");

        let content = std::fs::read_to_string(&output_path).expect("failed to read exported JSONL");
        let lines: Vec<&str> = content.lines().collect();
        assert_eq!(lines.len(), 2);
        assert!(lines[0].contains("\"tc-1\""));
        assert!(lines[1].contains("\"tc-2\""));
    }

    #[test]
    fn test_export_single_file_format() {
        let temp_dir = tempfile::tempdir().expect("failed to create temp dir");
        let output_path = temp_dir.path().join("input.txt");

        let suite = vec![
            GeneratedTestCase {
                id: "tc-1".to_string(),
                input: "1 2\n".to_string(),
                expected: "3\n".to_string(),
                is_hidden: false,
            },
            GeneratedTestCase {
                id: "tc-2".to_string(),
                input: "3 4\n".to_string(),
                expected: "7\n".to_string(),
                is_hidden: true,
            },
        ];

        let res = export_test_suite(&suite, output_path.to_str().unwrap(), OutputFormat::Single);
        assert!(res.is_ok(), "Single file export failed");

        let content = std::fs::read_to_string(&output_path).expect("failed to read single file");
        assert!(content.starts_with("2\n"));
        assert!(content.contains("1 2\n"));
        assert!(content.contains("3 4\n"));
    }

    #[test]
    fn test_export_dir_format() {
        let temp_dir = tempfile::tempdir().expect("failed to create temp dir");
        let output_dir = temp_dir.path().join("test_dir");

        let suite = vec![
            GeneratedTestCase {
                id: "tc-1".to_string(),
                input: "5\n".to_string(),
                expected: "25\n".to_string(),
                is_hidden: false,
            },
        ];

        let res = export_test_suite(&suite, output_dir.to_str().unwrap(), OutputFormat::Dir);
        assert!(res.is_ok(), "Directory export failed");

        assert!(output_dir.join("01.in").exists());
        assert!(output_dir.join("01.out").exists());

        let in_content = std::fs::read_to_string(output_dir.join("01.in")).unwrap();
        let out_content = std::fs::read_to_string(output_dir.join("01.out")).unwrap();
        assert_eq!(in_content, "5\n");
        assert_eq!(out_content, "25\n");
    }
}
