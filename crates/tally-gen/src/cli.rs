// ==============================================================================
// Command Line Interface (CLI) Arguments Definition
// ==============================================================================

use crate::types::OutputFormat;
use clap::Parser;

/// Tally Test Case Generator (`tally-gen`)
///
/// High-performance test case generator for competitive programming problems.
/// Generates inputs via a generator script, calculates ground-truth outputs
/// via a reference solution, and exports formatted test suites.
#[derive(Parser, Debug)]
#[command(name = "tally-gen")]
#[command(author, version, about, long_about = None)]
pub struct Cli {
    /// Path to the generator script (e.g. `generator.py`)
    #[arg(short = 'g', long = "generator")]
    pub generator: String,

    /// Path to the official reference solution script/binary (e.g. `solution.py`)
    #[arg(short = 'r', long = "reference")]
    pub reference: String,

    /// Target function or method name inside the reference solution (e.g. `solve` or `twoSum`)
    #[arg(short = 'm', long = "method", default_value = "solve")]
    pub method: String,

    /// Number of test cases to generate
    #[arg(short = 'n', long = "tests", default_value_t = 100)]
    pub tests: usize,

    /// Base seed for deterministic random number generation
    #[arg(short = 's', long = "seed", default_value_t = 42)]
    pub seed: u64,

    /// Number of sample (visible) test cases at the start of the suite
    #[arg(long = "sample-cases", default_value_t = 5)]
    pub sample_cases: usize,

    /// Target destination file path or output directory
    #[arg(short = 'o', long = "output", default_value = "output.jsonl")]
    pub output: String,

    /// Export format for the generated test suite
    #[arg(short = 'f', long = "format", value_enum, default_value_t = OutputFormat::Jsonl)]
    pub format: OutputFormat,
}
