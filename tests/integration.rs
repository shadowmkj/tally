use bollard::{API_DEFAULT_VERSION, Docker};
use crust::models::{Language, TestCase, Verdict};
use crust::runner::execute_submission;
use serde_json::json;

const DOCKER_SOCKET: &str = "unix:///Users/milan/.docker/run/docker.sock";

/// Helper: connect to Docker.
fn docker() -> Docker {
    Docker::connect_with_unix(DOCKER_SOCKET, 120, API_DEFAULT_VERSION)
        .expect("Failed to connect to Docker daemon")
}

/// Helper: build a test case.
fn make_test_case(id: i32, input: serde_json::Value, expected: serde_json::Value) -> TestCase {
    TestCase {
        id,
        input,
        expected,
        is_hidden: false,
    }
}

// =============================================================================
// Integration tests — require a running Docker daemon.
// Run with: cargo test -- --test-threads=1
// =============================================================================

#[tokio::test]
async fn test_correct_solution_returns_accepted() {
    let code = r#"
class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 1:
            return 1
        a, b = 1, 1
        for _ in range(2, n + 1):
            a, b = b, a + b
        return b
"#;

    let docker = docker();
    let tc = make_test_case(9001, json!({"n": 5}), json!(8));

    let verdict = execute_submission(&docker, tc, &Language::Python, "climbStairs", code)
        .await
        .expect("execute_submission failed");

    assert_eq!(verdict, Verdict::Accepted);
}

#[tokio::test]
async fn test_wrong_answer_detected() {
    let code = r#"
class Solution:
    def climbStairs(self, n: int) -> int:
        return 42
"#;

    let docker = docker();
    let tc = make_test_case(9002, json!({"n": 3}), json!(3));

    let verdict = execute_submission(&docker, tc, &Language::Python, "climbStairs", code)
        .await
        .expect("execute_submission failed");

    match verdict {
        Verdict::WrongAnswer { expected, got } => {
            assert_eq!(expected, json!(3));
            assert_eq!(got, json!(42));
        }
        other => panic!("Expected WrongAnswer, got {:?}", other),
    }
}

#[tokio::test]
async fn test_runtime_error_detected() {
    let code = r#"
class Solution:
    def climbStairs(self, n: int) -> int:
        raise ValueError("something went wrong")
"#;

    let docker = docker();
    let tc = make_test_case(9003, json!({"n": 1}), json!(1));

    let verdict = execute_submission(&docker, tc, &Language::Python, "climbStairs", code)
        .await
        .expect("execute_submission failed");

    match verdict {
        Verdict::RuntimeError(msg) => {
            assert!(
                msg.contains("something went wrong"),
                "Error message should contain the exception text, got: {}",
                msg
            );
        }
        other => panic!("Expected RuntimeError, got {:?}", other),
    }
}

#[tokio::test]
async fn test_missing_method_returns_runtime_error() {
    let code = r#"
class Solution:
    def someOtherMethod(self, n: int) -> int:
        return n
"#;

    let docker = docker();
    let tc = make_test_case(9004, json!({"n": 1}), json!(1));

    let verdict = execute_submission(&docker, tc, &Language::Python, "climbStairs", code)
        .await
        .expect("execute_submission failed");

    match verdict {
        Verdict::RuntimeError(msg) => {
            assert!(
                msg.contains("not found"),
                "Error should mention method not found, got: {}",
                msg
            );
        }
        other => panic!("Expected RuntimeError, got {:?}", other),
    }
}

#[tokio::test]
async fn test_parameter_mismatch_returns_runtime_error() {
    // Solution has param named "steps" but input sends "n"
    let code = r#"
class Solution:
    def climbStairs(self, steps: int) -> int:
        return steps
"#;

    let docker = docker();
    let tc = make_test_case(9005, json!({"n": 3}), json!(3));

    let verdict = execute_submission(&docker, tc, &Language::Python, "climbStairs", code)
        .await
        .expect("execute_submission failed");

    match verdict {
        Verdict::RuntimeError(msg) => {
            assert!(
                msg.contains("Parameter mismatch"),
                "Error should mention parameter mismatch, got: {}",
                msg
            );
        }
        other => panic!("Expected RuntimeError, got {:?}", other),
    }
}

#[tokio::test]
async fn test_multiple_test_cases_independent() {
    let code = r#"
class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 1:
            return 1
        a, b = 1, 1
        for _ in range(2, n + 1):
            a, b = b, a + b
        return b
"#;

    let docker = docker();
    let cases = vec![
        (9006, json!({"n": 1}), json!(1)),
        (9007, json!({"n": 2}), json!(2)),
        (9008, json!({"n": 5}), json!(8)),
    ];

    for (id, input, expected) in cases {
        let tc = make_test_case(id, input, expected);
        let verdict = execute_submission(&docker, tc, &Language::Python, "climbStairs", code)
            .await
            .expect("execute_submission failed");

        assert_eq!(
            verdict,
            Verdict::Accepted,
            "Test case {} should be Accepted",
            id
        );
    }
}
