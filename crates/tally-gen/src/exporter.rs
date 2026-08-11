// ==============================================================================
// Exporter & Formatter Engine
// ==============================================================================

// This module handles serializing and saving the generated test cases to disk.
// Supported formats:
// - Jsonl: Pretty-printed JSON array matching Tally's code_tests/*.jsonl schema.
// - Single: Combined input file with total case count header.
// - Dir: Paired .in / .out text files (e.g. 01.in, 01.out) for DOMjudge/Polygon.

use crate::types::{GeneratedTestCase, OutputFormat};
use anyhow::{Context, Result};
use std::fs;
use std::io::Write;
use std::path::Path;

/// Ensures parent directories exist for target output file path.
fn ensure_parent_dir(output_path: &str) -> Result<()> {
    if let Some(parent) = Path::new(output_path)
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
    {
        fs::create_dir_all(parent)
            .with_context(|| format!("while creating output directory for '{}'", output_path))?;
    }
    Ok(())
}

/// Formats and exports a generated test suite to disk based on `format`.
pub fn export_test_suite(
    suite: &[GeneratedTestCase],
    output_path: &str,
    format: OutputFormat,
) -> Result<()> {
    match format {
        OutputFormat::Jsonl => {
            ensure_parent_dir(output_path)?;

            let json_pretty = serde_json::to_string_pretty(suite).with_context(|| {
                format!("while serializing test suite to JSON at '{}'", output_path)
            })?;

            fs::write(output_path, json_pretty)
                .with_context(|| format!("while writing test suite to '{}'", output_path))?;

            println!(
                "Successfully exported {} test cases to JSON at '{}'.",
                suite.len(),
                output_path
            );
        }
        OutputFormat::Single => {
            ensure_parent_dir(output_path)?;

            let mut file = fs::File::create(output_path)
                .with_context(|| format!("while creating output file '{}'", output_path))?;

            writeln!(file, "{}", suite.len())
                .with_context(|| format!("while writing count header to '{}'", output_path))?;

            for case in suite {
                let input_str = serde_json::to_string(&case.input)?;
                writeln!(file, "{}", input_str).with_context(|| {
                    format!(
                        "while writing input for testcase #{} to '{}'",
                        case.id, output_path
                    )
                })?;
            }
            println!(
                "Successfully exported {} test cases to single file at '{}'.",
                suite.len(),
                output_path
            );
        }
        OutputFormat::Dir => {
            fs::create_dir_all(output_path)
                .with_context(|| format!("while creating target directory '{}'", output_path))?;

            for case in suite {
                let in_file = format!("{}/{:02}.in", output_path, case.id);
                let out_file = format!("{}/{:02}.out", output_path, case.id);

                let input_str = serde_json::to_string_pretty(&case.input)?;
                let expected_str = serde_json::to_string_pretty(&case.expected)?;

                fs::write(&in_file, &input_str)
                    .with_context(|| format!("while writing input file '{}'", in_file))?;
                fs::write(&out_file, &expected_str)
                    .with_context(|| format!("while writing output file '{}'", out_file))?;
            }
            println!(
                "Successfully exported {} paired .in/.out test cases to directory '{}'.",
                suite.len(),
                output_path
            );
        }
    }

    Ok(())
}
