use rusqlite::{Connection, Result, params};
use std::path::Path;

use crate::models::{Job, TestCaseResult, Verdict};

/// Opens a connection to a SQLite database.
/// Strips "file:" prefix if present (e.g. from DATABASE_URL env var).
pub fn connect<P: AsRef<Path>>(path: P) -> Result<Connection> {
    let path_ref = path.as_ref();
    let path_str = path_ref.to_string_lossy();
    let clean_path = path_str.trim_start_matches("file:");

    let conn = Connection::open(clean_path)?;
    Ok(conn)
}

/// Updates submission status and test results in the SQLite database after evaluation.
pub fn update_submission_status(
    conn: &Connection,
    job: &Job,
    results: &[TestCaseResult],
) -> Result<Option<String>> {
    // 1. Resolve submission ID (from job payload or fallback to pending 'Evaluating' submission)
    let target_submission_id = match &job.submission_id {
        Some(id) if !id.is_empty() => Some(id.clone()),
        _ => {
            let mut stmt = conn.prepare(
                "SELECT id FROM Submission
                 WHERE LOWER(status) = 'evaluating'
                   AND (problemId = ?1 OR problemId = ?2)
                 ORDER BY timestamp DESC LIMIT 1",
            )?;

            stmt.query_row(params![job.problem_id, job.problem_slug], |row| {
                row.get::<_, String>(0)
            })
            .ok()
        }
    };

    let sub_id = match target_submission_id {
        Some(id) => id,
        None => return Ok(None),
    };

    let total = results.len();
    let passed = results
        .iter()
        .filter(|r| r.verdict == Verdict::Accepted)
        .count();

    // 2. Determine overall status & error log
    let (status, error_log) = if results.is_empty() {
        (
            "No Output".to_string(),
            Some("No test cases evaluated".to_string()),
        )
    } else if passed == total {
        ("Accepted".to_string(), None)
    } else {
        let first_failed = results.iter().find(|r| r.verdict != Verdict::Accepted);
        match first_failed {
            Some(tc_res) => match &tc_res.verdict {
                Verdict::Accepted => ("Accepted".to_string(), None),
                Verdict::WrongAnswer { .. } => ("Wrong Answer".to_string(), None),
                Verdict::RuntimeError(msg) => ("Runtime Error".to_string(), Some(msg.clone())),
                Verdict::TimeLimitExceeded => ("Time Limit Exceeded".to_string(), None),
                Verdict::NoOutput => ("No Output".to_string(), None),
            },
            None => ("Wrong Answer".to_string(), None),
        }
    };

    // 3. Update Submission row & 4. Upsert TestCaseResult records in a transaction
    let tx = conn.unchecked_transaction()?;

    tx.execute(
        "UPDATE Submission
         SET status = ?1,
             testCasesPassed = ?2,
             totalTestCases = ?3,
             errorLog = ?4
         WHERE id = ?5",
        params![status, passed as i32, total as i32, error_log, sub_id,],
    )?;

    // 4. Upsert TestCaseResult records
    for (idx, r) in results.iter().enumerate() {
        let tc_res_id = format!("{}-tc-{}", sub_id, idx + 1);
        let is_passed = r.verdict == Verdict::Accepted;
        let test_case_id = r.id.to_string();

        let (error, expected, actual) = match &r.verdict {
            Verdict::Accepted => (None, "".to_string(), "".to_string()),
            Verdict::WrongAnswer { expected, got } => (None, expected.to_string(), got.to_string()),
            Verdict::RuntimeError(msg) => (Some(msg.clone()), "".to_string(), "".to_string()),
            Verdict::TimeLimitExceeded => (
                Some("Time Limit Exceeded".to_string()),
                "".to_string(),
                "".to_string(),
            ),
            Verdict::NoOutput => (
                Some("No Output".to_string()),
                "".to_string(),
                "".to_string(),
            ),
        };

        tx.execute(
            "INSERT OR REPLACE INTO TestCaseResult
             (id, submissionId, testCaseId, passed, input, expectedOutput, actualOutput, executionTimeMs, memoryUsedMb, error)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                tc_res_id,
                sub_id,
                test_case_id,
                is_passed,
                "",
                expected,
                actual,
                0,
                0.0,
                error,
            ],
        )?;
    }

    tx.commit()?;

    Ok(Some(sub_id))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Language;

    #[test]
    fn test_connect_in_memory() {
        let conn = connect(":memory:");
        assert!(conn.is_ok());
    }

    #[test]
    fn test_connect_file_prefix() {
        let conn = connect("file::memory:");
        assert!(conn.is_ok());
    }

    #[test]
    fn test_update_submission_status() {
        let conn = connect(":memory:").unwrap();
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
             VALUES ('sub-1', 'comp-1', 'prob-1', 'Two Sum', 'milan', '123', 'python', 'code', 'Evaluating')",
            [],
        )
        .unwrap();

        let job = Job {
            submission_id: Some("sub-1".to_string()),
            problem_id: "prob-1".to_string(),
            problem_slug: "two-sum".to_string(),
            language: Language::Python,
            method_name: "twoSum".to_string(),
            type_schema: None,
            code: "code".to_string(),
            user: "milan".to_string(),
            user_id: "u1".to_string(),
        };

        let results = vec![
            TestCaseResult {
                id: 1,
                verdict: Verdict::Accepted,
            },
            TestCaseResult {
                id: 2,
                verdict: Verdict::Accepted,
            },
        ];

        let updated_id = update_submission_status(&conn, &job, &results).unwrap();
        assert_eq!(updated_id, Some("sub-1".to_string()));

        let mut stmt = conn
            .prepare(
                "SELECT status, testCasesPassed, totalTestCases FROM Submission WHERE id = 'sub-1'",
            )
            .unwrap();
        let (status, passed, total): (String, i32, i32) = stmt
            .query_row([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
            .unwrap();

        assert_eq!(status, "Accepted");
        assert_eq!(passed, 2);
        assert_eq!(total, 2);
    }
}
