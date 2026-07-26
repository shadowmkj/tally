use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fmt;

/// A single test case loaded from the JSON test file.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TestCase {
    pub id: i32,
    /// Arbitrary JSON object whose keys map to the solution's parameters.
    pub input: Value,
    pub expected: Value,
    pub is_hidden: bool,
}

/// The JSON envelope returned by every language driver on stdout.
#[derive(Debug, Deserialize)]
pub struct DriverResponse {
    pub success: bool,         // If the code execution worked successfully
    pub result: Option<Value>, // Result of the execution
    pub error: Option<String>, // Error if execution failed (success = false)
}

/// The judging result for a single test case.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Verdict {
    /// Solution produced the correct output.
    Accepted,
    /// Solution ran successfully but produced wrong output.
    WrongAnswer { expected: Value, got: Value },
    /// Solution crashed at runtime (e.g. ZeroDivisionError, IndexError).
    RuntimeError(String),
    /// Solution execution took too long (infinite loop or inefficient algorithm).
    TimeLimitExceeded,
    /// Container produced no parseable stdout (driver crash, timeout, etc.).
    NoOutput,
}

impl fmt::Display for Verdict {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Verdict::Accepted => write!(f, "✅ ACCEPTED (AC)"),
            Verdict::WrongAnswer { expected, got } => {
                write!(f, "❌ WRONG ANSWER (WA) — expected {expected}, got {got}")
            }
            Verdict::RuntimeError(msg) => write!(f, "❌ RUNTIME ERROR (RE) — {msg}"),
            Verdict::TimeLimitExceeded => write!(f, "⏱️ TIME LIMIT EXCEEDED (TLE)"),
            Verdict::NoOutput => write!(f, "❌ NO OUTPUT"),
        }
    }
}

/// The result of judging a single test case.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestCaseResult {
    pub id: i32,
    pub verdict: Verdict,
}

/// Supported submission languages.
#[derive(Debug, Clone, clap::ValueEnum, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    #[serde(alias = "python3", alias = "python")]
    Python,
    #[serde(alias = "java")]
    Java,
    #[serde(alias = "c")]
    C,
    #[serde(alias = "cpp", alias = "c++")]
    Cpp,
}

/// Incoming job payload from Redis queue.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Job {
    pub problem_id: String,
    pub problem_slug: String,
    pub language: Language,
    pub method_name: String,
    pub type_schema: Option<String>,
    pub code: String,
    pub user: String,
    pub user_id: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SubmissionResult {
    pub user: String,
    pub user_id: String,
    pub tests: Vec<TestCaseResult>,
    pub problem_id: String,
    pub problem_slug: String,
    pub success: bool,
    pub passed: u32,
    pub failed: u32,
}

impl SubmissionResult {
    pub fn new(
        user: String,
        user_id: String,
        tests: Vec<TestCaseResult>,
        problem_id: String,
        problem_slug: String,
        success: bool,
        passed: u32,
        failed: u32,
    ) -> Self {
        Self {
            user,
            user_id,
            tests,
            problem_id,
            problem_slug,
            success,
            passed,
            failed,
        }
    }
}
