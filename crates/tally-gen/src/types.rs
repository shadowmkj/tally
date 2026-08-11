// ==============================================================================
// Domain Data Types & Enums
// ==============================================================================

// This module defines the core data structures used throughout tally-gen for
// representing test cases and specifying export output formats matching Tally's schema.

use clap::ValueEnum;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Represents a single generated test case matching Tally's testcase JSON schema.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GeneratedTestCase {
    pub id: usize,
    pub input: Value,
    pub expected: Value,
    pub is_hidden: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub explanation: Option<String>,
}

/// Target output export formats supported by tally-gen.
///
/// - `Jsonl`: Formatted JSON array matching Tally's `code_tests/*.jsonl` schema.
/// - `Single`: A single combined input file with a total testcase count header.
/// - `Dir`: Paired input and expected output files (`01.in`, `01.out`) for CP judgers.
#[derive(Debug, Clone, Copy, ValueEnum, Serialize, Deserialize, PartialEq, Eq)]
pub enum OutputFormat {
    Jsonl,
    Single,
    Dir,
}
