use bollard::{API_DEFAULT_VERSION, Docker};
use crust::models::{Language, TestCase, Verdict};
use crust::runner::run_all;
use serde_json::json;

const DOCKER_SOCKET: &str = "unix:///Users/milan/.docker/run/docker.sock";

fn docker() -> Docker {
    Docker::connect_with_unix(DOCKER_SOCKET, 120, API_DEFAULT_VERSION)
        .expect("Failed to connect to Docker daemon")
}

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
async fn test_all_correct_returns_all_accepted() {
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

    let cases = vec![
        make_test_case(1, json!({"n": 1}), json!(1)),
        make_test_case(2, json!({"n": 2}), json!(2)),
        make_test_case(3, json!({"n": 5}), json!(8)),
    ];

    let results = run_all(&docker(), cases, &Language::Python, "climbStairs", code)
        .await
        .expect("run_all failed");

    assert_eq!(results.len(), 3, "Should have results for all 3 test cases");
    for r in &results {
        assert_eq!(r.verdict, Verdict::Accepted, "Test case {} should be AC", r.id);
    }
}

#[tokio::test]
async fn test_stops_early_on_wrong_answer() {
    // This solution always returns 42 — TC 1 will fail, TC 2 should not be judged.
    let code = r#"
class Solution:
    def climbStairs(self, n: int) -> int:
        return 42
"#;

    let cases = vec![
        make_test_case(1, json!({"n": 3}), json!(3)),
        make_test_case(2, json!({"n": 5}), json!(8)),
        make_test_case(3, json!({"n": 1}), json!(1)),
    ];

    let results = run_all(&docker(), cases, &Language::Python, "climbStairs", code)
        .await
        .expect("run_all failed");

    // Should stop after the first failure
    assert_eq!(results.len(), 1, "Should stop after first WA");
    match &results[0].verdict {
        Verdict::WrongAnswer { expected, got } => {
            assert_eq!(*expected, json!(3));
            assert_eq!(*got, json!(42));
        }
        other => panic!("Expected WrongAnswer, got {:?}", other),
    }
}

#[tokio::test]
async fn test_stops_early_on_runtime_error() {
    let code = r#"
class Solution:
    def climbStairs(self, n: int) -> int:
        raise ValueError("boom")
"#;

    let cases = vec![
        make_test_case(1, json!({"n": 1}), json!(1)),
        make_test_case(2, json!({"n": 2}), json!(2)),
    ];

    let results = run_all(&docker(), cases, &Language::Python, "climbStairs", code)
        .await
        .expect("run_all failed");

    assert_eq!(results.len(), 1, "Should stop after first RE");
    match &results[0].verdict {
        Verdict::RuntimeError(msg) => {
            assert!(msg.contains("boom"), "Error should contain 'boom', got: {}", msg);
        }
        other => panic!("Expected RuntimeError, got {:?}", other),
    }
}

#[tokio::test]
async fn test_partial_pass_then_fail() {
    // Returns n — correct for n=1 (expected 1), wrong for n=3 (expected 3, returns 3... wait)
    // Actually climbStairs(1)=1, climbStairs(2)=2, climbStairs(3)=3
    // A solution that returns n would be correct for 1,2,3 but wrong for 5 (expected 8, got 5)
    let code = r#"
class Solution:
    def climbStairs(self, n: int) -> int:
        return n
"#;

    let cases = vec![
        make_test_case(1, json!({"n": 1}), json!(1)),   // n=1, expected 1 → AC (returns 1)
        make_test_case(2, json!({"n": 2}), json!(2)),   // n=2, expected 2 → AC (returns 2)
        make_test_case(3, json!({"n": 5}), json!(8)),   // n=5, expected 8 → WA (returns 5)
        make_test_case(4, json!({"n": 10}), json!(89)), // should not be reached
    ];

    let results = run_all(&docker(), cases, &Language::Python, "climbStairs", code)
        .await
        .expect("run_all failed");

    assert_eq!(results.len(), 3, "2 AC + 1 WA, then stop");
    assert_eq!(results[0].verdict, Verdict::Accepted);
    assert_eq!(results[1].verdict, Verdict::Accepted);
    match &results[2].verdict {
        Verdict::WrongAnswer { expected, got } => {
            assert_eq!(*expected, json!(8));
            assert_eq!(*got, json!(5));
        }
        other => panic!("Expected WrongAnswer for TC 3, got {:?}", other),
    }
}

#[tokio::test]
async fn test_missing_method() {
    let code = r#"
class Solution:
    def someOtherMethod(self, n: int) -> int:
        return n
"#;

    let cases = vec![make_test_case(1, json!({"n": 1}), json!(1))];

    let results = run_all(&docker(), cases, &Language::Python, "climbStairs", code)
        .await
        .expect("run_all failed");

    // The driver exits with an error before processing any input,
    // so no stdout response is produced → NoOutput.
    assert_eq!(results.len(), 1);
    match &results[0].verdict {
        Verdict::RuntimeError(msg) => {
            assert!(msg.contains("not found"), "Should mention not found, got: {}", msg);
        }
        Verdict::NoOutput => {} // also acceptable — driver exits before reading stdin
        other => panic!("Expected RuntimeError or NoOutput, got {:?}", other),
    }
}

#[tokio::test]
async fn test_empty_test_cases() {
    let code = r#"
class Solution:
    def climbStairs(self, n: int) -> int:
        return 1
"#;

    let results = run_all(&docker(), vec![], &Language::Python, "climbStairs", code)
        .await
        .expect("run_all failed");

    assert!(results.is_empty(), "No test cases should produce no results");
}

#[tokio::test]
async fn test_infinite_loop_returns_time_limit_exceeded() {
    let code = r#"
class Solution:
    def climbStairs(self, n: int) -> int:
        while True:
            pass
        return 0
"#;

    let cases = vec![make_test_case(1, json!({"n": 1}), json!(1))];

    let results = run_all(&docker(), cases, &Language::Python, "climbStairs", code)
        .await
        .expect("run_all failed");

    assert_eq!(results.len(), 1, "Should time out and stop");
    assert_eq!(
        results[0].verdict,
        Verdict::TimeLimitExceeded,
        "Expected TLE due to infinite loop"
    );
}
