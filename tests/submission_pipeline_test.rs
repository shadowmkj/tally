use tally::db::{connect, update_submission_status};
use tally::models::{Job, Language, TestCaseResult, Verdict};

#[test]
fn test_full_submission_db_lifecycle() {
    let conn = connect(":memory:").expect("failed to connect to memory db");

    conn.execute(
        "CREATE TABLE Submission (
            id TEXT PRIMARY KEY,
            competitionId TEXT NOT NULL,
            problemId TEXT NOT NULL,
            problemTitle TEXT NOT NULL,
            participantId TEXT,
            participantName TEXT NOT NULL,
            collegeId TEXT NOT NULL,
            language TEXT NOT NULL,
            code TEXT NOT NULL,
            status TEXT NOT NULL,
            testCasesPassed INTEGER NOT NULL DEFAULT 0,
            totalTestCases INTEGER NOT NULL DEFAULT 0,
            errorLog TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )
    .unwrap();

    conn.execute(
        "CREATE TABLE TestCaseResult (
            id TEXT PRIMARY KEY,
            submissionId TEXT NOT NULL,
            testCaseId TEXT NOT NULL,
            passed BOOLEAN NOT NULL,
            input TEXT NOT NULL,
            expectedOutput TEXT NOT NULL,
            actualOutput TEXT NOT NULL,
            executionTimeMs INTEGER NOT NULL,
            memoryUsedMb REAL NOT NULL,
            error TEXT
        )",
        [],
    )
    .unwrap();

    // 1. Insert pending evaluation submission
    conn.execute(
        "INSERT INTO Submission (id, competitionId, problemId, problemTitle, participantName, collegeId, language, code, status)
         VALUES ('sub-100', 'comp-demo', 'prob-two-sum', 'Two Sum', 'Alice', 'CLG1', 'python', 'def twoSum(): pass', 'Evaluating')",
        [],
    )
    .unwrap();

    // 2. Create Job payload
    let job = Job {
        submission_id: Some("sub-100".to_string()),
        problem_id: "prob-two-sum".to_string(),
        problem_slug: "two-sum".to_string(),
        language: Language::Python,
        method_name: "twoSum".to_string(),
        type_schema: None,
        code: "def twoSum(nums, target): return [0, 1]".to_string(),
        user: "Alice".to_string(),
        user_id: "u-alice".to_string(),
    };

    // 3. Create test case results
    let results = vec![
        TestCaseResult {
            id: 1,
            verdict: Verdict::Accepted,
        },
        TestCaseResult {
            id: 2,
            verdict: Verdict::Accepted,
        },
        TestCaseResult {
            id: 3,
            verdict: Verdict::Accepted,
        },
    ];

    // 4. Update status
    let updated = update_submission_status(&conn, &job, &results).unwrap();
    assert_eq!(updated, Some("sub-100".to_string()));

    // 5. Query submission row
    let (status, passed, total): (String, i32, i32) = conn
        .query_row(
            "SELECT status, testCasesPassed, totalTestCases FROM Submission WHERE id = 'sub-100'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .unwrap();

    assert_eq!(status, "Accepted");
    assert_eq!(passed, 3);
    assert_eq!(total, 3);

    // 6. Query TestCaseResult rows
    let tc_count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM TestCaseResult WHERE submissionId = 'sub-100' AND passed = 1",
            [],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(tc_count, 3);
}

#[test]
fn test_submission_db_wrong_answer_lifecycle() {
    let conn = connect(":memory:").expect("failed to connect to memory db");

    conn.execute(
        "CREATE TABLE Submission (
            id TEXT PRIMARY KEY,
            competitionId TEXT NOT NULL,
            problemId TEXT NOT NULL,
            problemTitle TEXT NOT NULL,
            participantId TEXT,
            participantName TEXT NOT NULL,
            collegeId TEXT NOT NULL,
            language TEXT NOT NULL,
            code TEXT NOT NULL,
            status TEXT NOT NULL,
            testCasesPassed INTEGER NOT NULL DEFAULT 0,
            totalTestCases INTEGER NOT NULL DEFAULT 0,
            errorLog TEXT
        )",
        [],
    )
    .unwrap();

    conn.execute(
        "CREATE TABLE TestCaseResult (
            id TEXT PRIMARY KEY,
            submissionId TEXT NOT NULL,
            testCaseId TEXT NOT NULL,
            passed BOOLEAN NOT NULL,
            input TEXT NOT NULL,
            expectedOutput TEXT NOT NULL,
            actualOutput TEXT NOT NULL,
            executionTimeMs INTEGER NOT NULL,
            memoryUsedMb REAL NOT NULL,
            error TEXT
        )",
        [],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO Submission (id, competitionId, problemId, problemTitle, participantName, collegeId, language, code, status)
         VALUES ('sub-200', 'comp-demo', 'prob-climb', 'Climbing Stairs', 'Bob', 'CLG2', 'java', 'class Solution {}', 'Evaluating')",
        [],
    )
    .unwrap();

    let job = Job {
        submission_id: Some("sub-200".to_string()),
        problem_id: "prob-climb".to_string(),
        problem_slug: "climbing-stairs".to_string(),
        language: Language::Java,
        method_name: "climbStairs".to_string(),
        type_schema: None,
        code: "class Solution {}".to_string(),
        user: "Bob".to_string(),
        user_id: "u-bob".to_string(),
    };

    let results = vec![
        TestCaseResult {
            id: 1,
            verdict: Verdict::Accepted,
        },
        TestCaseResult {
            id: 2,
            verdict: Verdict::WrongAnswer {
                expected: serde_json::json!(8),
                got: serde_json::json!(5),
            },
        },
    ];

    let updated = update_submission_status(&conn, &job, &results).unwrap();
    assert_eq!(updated, Some("sub-200".to_string()));

    let (status, passed, total): (String, i32, i32) = conn
        .query_row(
            "SELECT status, testCasesPassed, totalTestCases FROM Submission WHERE id = 'sub-200'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .unwrap();

    assert_eq!(status, "Wrong Answer");
    assert_eq!(passed, 1);
    assert_eq!(total, 2);

    let (expected, actual): (String, String) = conn
        .query_row(
            "SELECT expectedOutput, actualOutput FROM TestCaseResult WHERE id = 'sub-200-tc-2'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap();

    assert_eq!(expected, "8");
    assert_eq!(actual, "5");
}
