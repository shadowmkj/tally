// ==============================================================================
// Domain Data Types & Enums
// ==============================================================================

// This module defines the core data structures used throughout tally-gen for
// representing test cases and specifying export output formats.

use clap::ValueEnum;
use serde::{Deserialize, Serialize};

/// Represents a single generated test case with its unique ID,
/// generated input text, calculated expected output, and visibility state.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GeneratedTestCase {
    pub id: String,
    pub input: String,
    pub expected: String,
    pub is_hidden: bool,
}

/// Target output export formats supported by tally-gen.
///
/// - `Jsonl`: Newline-delimited JSON objects matching Tally's standard schema.
/// - `Single`: A single combined input file with a total testcase count header.
/// - `Dir`: Paired input and expected output files (`01.in`, `01.out`) for CP judgers.
#[derive(Debug, Clone, Copy, ValueEnum, Serialize, Deserialize, PartialEq, Eq)]
pub enum OutputFormat {
    Jsonl,
    Single,
    Dir,
}
