use serde_json::Value;

use crate::models::{DriverResponse, Verdict};

/// Compare a driver's response against the expected value and produce a verdict.
pub fn judge(driver_res: &DriverResponse, expected: &Value) -> Verdict {
    if !driver_res.success {
        return Verdict::RuntimeError(
            driver_res
                .error
                .clone()
                .unwrap_or_else(|| "unknown error".into()),
        );
    }

    if driver_res.result.as_ref() == Some(expected) {
        Verdict::Accepted
    } else {
        Verdict::WrongAnswer {
            expected: expected.clone(),
            got: driver_res
                .result
                .clone()
                .unwrap_or(Value::Null),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn judge_accepted() {
        let res = DriverResponse {
            success: true,
            result: Some(json!(42)),
            error: None,
        };
        assert_eq!(judge(&res, &json!(42)), Verdict::Accepted);
    }

    #[test]
    fn judge_wrong_answer() {
        let res = DriverResponse {
            success: true,
            result: Some(json!(99)),
            error: None,
        };
        let v = judge(&res, &json!(42));
        assert_eq!(
            v,
            Verdict::WrongAnswer {
                expected: json!(42),
                got: json!(99),
            }
        );
    }

    #[test]
    fn judge_runtime_error_with_message() {
        let res = DriverResponse {
            success: false,
            result: None,
            error: Some("ZeroDivisionError".into()),
        };
        assert_eq!(
            judge(&res, &json!(1)),
            Verdict::RuntimeError("ZeroDivisionError".into())
        );
    }

    #[test]
    fn judge_runtime_error_without_message() {
        let res = DriverResponse {
            success: false,
            result: None,
            error: None,
        };
        assert_eq!(
            judge(&res, &json!(1)),
            Verdict::RuntimeError("unknown error".into())
        );
    }

    #[test]
    fn judge_null_result_is_wrong_answer() {
        let res = DriverResponse {
            success: true,
            result: None,
            error: None,
        };
        assert_eq!(
            judge(&res, &json!(1)),
            Verdict::WrongAnswer {
                expected: json!(1),
                got: Value::Null,
            }
        );
    }
}
