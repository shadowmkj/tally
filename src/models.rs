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
    #[serde(default, alias = "submission_id", alias = "submissionId")]
    pub submission_id: Option<String>,
    #[serde(default, alias = "test_file", alias = "testFile")]
    pub test_file: Option<String>,
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

#[allow(clippy::too_many_arguments)]
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_verdict_display() {
        assert_eq!(format!("{}", Verdict::Accepted), "✅ ACCEPTED (AC)");
        assert_eq!(
            format!(
                "{}",
                Verdict::WrongAnswer {
                    expected: json!(5),
                    got: json!(3)
                }
            ),
            "❌ WRONG ANSWER (WA) — expected 5, got 3"
        );
        assert_eq!(
            format!("{}", Verdict::RuntimeError("Division by zero".into())),
            "❌ RUNTIME ERROR (RE) — Division by zero"
        );
        assert_eq!(
            format!("{}", Verdict::TimeLimitExceeded),
            "⏱️ TIME LIMIT EXCEEDED (TLE)"
        );
        assert_eq!(format!("{}", Verdict::NoOutput), "❌ NO OUTPUT");
    }

    #[test]
    fn test_language_serde() {
        let py: Language = serde_json::from_str("\"python3\"").unwrap();
        assert_eq!(py, Language::Python);

        let py2: Language = serde_json::from_str("\"python\"").unwrap();
        assert_eq!(py2, Language::Python);

        let java: Language = serde_json::from_str("\"java\"").unwrap();
        assert_eq!(java, Language::Java);

        let c: Language = serde_json::from_str("\"c\"").unwrap();
        assert_eq!(c, Language::C);

        let cpp: Language = serde_json::from_str("\"cpp\"").unwrap();
        assert_eq!(cpp, Language::Cpp);

        let cpp2: Language = serde_json::from_str("\"c++\"").unwrap();
        assert_eq!(cpp2, Language::Cpp);
    }

    #[test]
    fn test_job_deserialization() {
        let json_data = json!({
            "problem_id": "prob-123",
            "problem_slug": "two-sum",
            "language": "python3",
            "method_name": "twoSum",
            "type_schema": null,
            "code": "def twoSum(nums, target): pass",
            "user": "Alice",
            "user_id": "u-456",
            "submissionId": "sub-789"
        });

        let job: Job = serde_json::from_value(json_data).unwrap();
        assert_eq!(job.problem_id, "prob-123");
        assert_eq!(job.problem_slug, "two-sum");
        assert_eq!(job.language, Language::Python);
        assert_eq!(job.method_name, "twoSum");
        assert_eq!(job.submission_id, Some("sub-789".to_string()));

        // Also test submission_id snake_case alias
        let json_snake = json!({
            "problem_id": "prob-123",
            "problem_slug": "two-sum",
            "language": "c++",
            "method_name": "twoSum",
            "code": "code",
            "user": "Bob",
            "user_id": "u-789",
            "submission_id": "sub-101"
        });

        let job_snake: Job = serde_json::from_value(json_snake).unwrap();
        assert_eq!(job_snake.language, Language::Cpp);
        assert_eq!(job_snake.submission_id, Some("sub-101".to_string()));
    }

    #[test]
    fn test_driver_response_deserialization() {
        let succ_json = json!({
            "success": true,
            "result": [0, 1]
        });
        let resp: DriverResponse = serde_json::from_value(succ_json).unwrap();
        assert!(resp.success);
        assert_eq!(resp.result, Some(json!([0, 1])));
        assert!(resp.error.is_none());

        let err_json = json!({
            "success": false,
            "error": "IndexError: list index out of range"
        });
        let err_resp: DriverResponse = serde_json::from_value(err_json).unwrap();
        assert!(!err_resp.success);
        assert_eq!(
            err_resp.error,
            Some("IndexError: list index out of range".to_string())
        );
    }

    #[test]
    fn test_submission_result_new() {
        let tc = TestCaseResult {
            id: 1,
            verdict: Verdict::Accepted,
        };
        let sub = SubmissionResult::new(
            "Alice".to_string(),
            "u-1".to_string(),
            vec![tc],
            "p-1".to_string(),
            "two-sum".to_string(),
            true,
            1,
            0,
        );

        assert_eq!(sub.user, "Alice");
        assert_eq!(sub.passed, 1);
        assert_eq!(sub.failed, 0);
        assert!(sub.success);
    }
}
