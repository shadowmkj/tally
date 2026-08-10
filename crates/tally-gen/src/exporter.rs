// ==============================================================================
// Exporter & Formatter Engine
// ==============================================================================

// This module handles serializing and saving the generated test cases to disk.
// Supported formats:
// - Jsonl: Newline-delimited JSON objects for Tally API / DB.
// - Single: Combined input file with total case count header.
// - Dir: Paired .in / .out text files (e.g. 01.in, 01.out) for DOMjudge/Polygon.

use crate::types::{GeneratedTestCase, OutputFormat};
use anyhow::{Context, Result};
use std::fs;
use std::io::Write;
use std::path::Path;

/// Formats and exports a generated test suite to disk based on `format`.
pub fn export_test_suite(
    suite: &[GeneratedTestCase],
    output_path: &str,
    format: OutputFormat,
) -> Result<()> {
    match format {
        OutputFormat::Jsonl => {
            if let Some(parent) = Path::new(output_path).parent() {
                if !parent.as_os_str().is_empty() {
                    fs::create_dir_all(parent)
                        .with_context(|| format!("while creating output directory for '{}'", output_path))?;
                }
            }

            let mut file = fs::File::create(output_path)
                .with_context(|| format!("while creating output file '{}'", output_path))?;

            for case in suite {
                let json_line = serde_json::to_string(case)
                    .with_context(|| format!("while serializing test case '{}' to JSON", case.id))?;
                writeln!(file, "{}", json_line)
                    .with_context(|| format!("while writing test case '{}' to '{}'", case.id, output_path))?;
            }
            println!("Successfully exported {} test cases to JSONL at '{}'.", suite.len(), output_path);
        }
        OutputFormat::Single => {
            if let Some(parent) = Path::new(output_path).parent() {
                if !parent.as_os_str().is_empty() {
                    fs::create_dir_all(parent)
                        .with_context(|| format!("while creating output directory for '{}'", output_path))?;
                }
            }

            let mut file = fs::File::create(output_path)
                .with_context(|| format!("while creating output file '{}'", output_path))?;

            writeln!(file, "{}", suite.len())
                .with_context(|| format!("while writing count header to '{}'", output_path))?;

            for case in suite {
                write!(file, "{}", case.input)
                    .with_context(|| format!("while writing input for '{}' to '{}'", case.id, output_path))?;
            }
            println!("Successfully exported {} test cases to single file at '{}'.", suite.len(), output_path);
        }
        OutputFormat::Dir => {
            fs::create_dir_all(output_path)
                .with_context(|| format!("while creating target directory '{}'", output_path))?;

            for (idx, case) in suite.iter().enumerate() {
                let num = idx + 1;
                let in_file = format!("{}/{:02}.in", output_path, num);
                let out_file = format!("{}/{:02}.out", output_path, num);

                fs::write(&in_file, &case.input)
                    .with_context(|| format!("while writing input file '{}'", in_file))?;
                fs::write(&out_file, &case.expected)
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
