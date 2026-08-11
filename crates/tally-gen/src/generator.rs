// ==============================================================================
// Subprocess Execution Engine
// ==============================================================================

// This module handles asynchronous process invocation for both generator scripts
// and reference solution scripts. It uses tokio::process::Command to avoid blocking
// the async runtime and streams stdin/stdout directly to minimize memory overhead.

use anyhow::{Context, Result};
use std::process::Stdio;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;

/// Executes the input generator script with a deterministic seed argument.
///
/// If `generator_path` ends with `.py`, it is executed using `python3` (or `python`).
/// Otherwise, it is executed directly as a compiled binary executable.
pub async fn generate_input(generator_path: &str, seed: u64) -> Result<String> {
    let mut cmd = if generator_path.ends_with(".py") {
        let mut c = Command::new("python3");
        c.arg(generator_path);
        c
    } else {
        Command::new(generator_path)
    };

    cmd.arg("--seed")
        .arg(seed.to_string())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let output = cmd
        .output()
        .await
        .with_context(|| format!("while executing generator script at '{}'", generator_path))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!(
            "Generator script at '{}' failed with exit code {:?}: {}",
            generator_path,
            output.status.code(),
            stderr.trim()
        );
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Executes the reference solution on the generated input text to calculate expected output.
///
/// If `reference_path` ends with `.py`, it executes via an inline Python driver wrapper
/// that dynamically loads the module via `importlib`, invokes `method_name` (e.g. `solve` or `twoSum`),
/// and serializes the return value to JSON.
pub async fn compute_expected(
    reference_path: &str,
    method_name: &str,
    input_data: &str,
) -> Result<String> {
    let mut child = if reference_path.ends_with(".py") {
        let driver_snippet = r#"
import sys, os, ast, json, importlib.util

ref_path = os.path.abspath(sys.argv[1])
method_name = sys.argv[2]

sys.path.insert(0, os.path.dirname(ref_path))

spec = importlib.util.spec_from_file_location("ref_solution_mod", ref_path)
if spec is None or spec.loader is None:
    raise ImportError(f"Could not load module spec for '{ref_path}'")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

if hasattr(mod, 'Solution'):
    fn = getattr(mod.Solution(), method_name)
elif hasattr(mod, method_name):
    fn = getattr(mod, method_name)
else:
    raise AttributeError(f"Method '{method_name}' not found in '{ref_path}'")

raw_input = sys.stdin.read().strip()
lines = [l.strip() for l in raw_input.splitlines() if l.strip()]

def parse_val(val_str):
    try:
        return ast.literal_eval(val_str)
    except Exception:
        parts = val_str.split()
        if len(parts) > 1:
            try:
                return [int(p) for p in parts]
            except Exception:
                try:
                    return [float(p) for p in parts]
                except Exception:
                    return parts
        try:
            return int(val_str)
        except Exception:
            try:
                return float(val_str)
            except Exception:
                return val_str

args = [parse_val(l) for l in lines]
if not args:
    res = fn()
elif len(args) == 1 and isinstance(args[0], dict):
    try:
        res = fn(**args[0])
    except TypeError:
        try:
            res = fn(args[0])
        except TypeError:
            res = fn(*args[0].values())
elif len(args) == 1:
    try:
        res = fn(args[0])
    except TypeError:
        res = fn(*args)
else:
    try:
        res = fn(*args)
    except TypeError:
        res = fn(args)

if isinstance(res, (dict, list, bool, int, float)) or res is None:
    print(json.dumps(res))
else:
    print(str(res))
"#;
        let mut c = Command::new("python3");
        c.arg("-c").arg(driver_snippet).arg(reference_path).arg(method_name);
        c
    } else {
        Command::new(reference_path)
    };

    child
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut process = child
        .spawn()
        .with_context(|| format!("while spawning reference solution at '{}'", reference_path))?;

    if let Some(mut stdin) = process.stdin.take() {
        stdin
            .write_all(input_data.as_bytes())
            .await
            .with_context(|| format!("while writing input to reference stdin for '{}'", reference_path))?;
        stdin
            .flush()
            .await
            .with_context(|| format!("while flushing stdin to reference for '{}'", reference_path))?;
    }

    let output = process
        .wait_with_output()
        .await
        .with_context(|| format!("while waiting for reference solution execution of '{}'", reference_path))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!(
            "Reference solution at '{}' failed with exit code {:?}: {}",
            reference_path,
            output.status.code(),
            stderr.trim()
        );
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

// ==============================================================================
// Unit Tests: Subprocess Script Execution
// ==============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[tokio::test]
    async fn test_generate_input_python_script() {
        let mut script_file = NamedTempFile::with_suffix(".py").expect("failed to create temp py file");
        let script_content = r#"import sys, argparse
parser = argparse.ArgumentParser()
parser.add_argument('--seed', type=int, required=True)
args = parser.parse_args()
print(f"SEED_{args.seed}")
"#;
        script_file
            .write_all(script_content.as_bytes())
            .expect("failed to write test Python script content");

        let path_str = script_file
            .path()
            .to_str()
            .expect("failed to convert temp file path to string slice");
        let result = generate_input(path_str, 42).await;
        assert!(result.is_ok(), "generate_input should succeed for Python script");
        assert_eq!(
            result.expect("expected successful generate_input output string").trim(),
            "SEED_42"
        );
    }

    #[tokio::test]
    async fn test_compute_expected_python_driver() {
        let mut script_file = NamedTempFile::with_suffix(".py").expect("failed to create temp py file");
        let script_content = r#"
def solve(nums, target):
    return [a + target for a in nums]
"#;
        script_file
            .write_all(script_content.as_bytes())
            .expect("failed to write test solution script content");

        let path_str = script_file
            .path()
            .to_str()
            .expect("failed to convert temp solution file path to string slice");
        let input_text = "{\"nums\": [1, 2, 3], \"target\": 10}\n";
        let result = compute_expected(path_str, "solve", input_text).await;
        assert!(result.is_ok(), "compute_expected should succeed with Python driver: {:?}", result.err());
        assert_eq!(
            result.expect("expected successful compute_expected output string").trim(),
            "[11, 12, 13]"
        );
    }
}
