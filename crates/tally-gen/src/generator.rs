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

/// Executes the reference solution on the generated input text to calculate the expected output.
///
/// Pipes the input text directly via `stdin` to prevent temporary file overhead.
pub async fn compute_expected(reference_path: &str, input_data: &str) -> Result<String> {
    let mut cmd = if reference_path.ends_with(".py") {
        let mut c = Command::new("python3");
        c.arg(reference_path);
        c
    } else {
        Command::new(reference_path)
    };

    cmd.stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .with_context(|| format!("while spawning reference solution at '{}'", reference_path))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(input_data.as_bytes())
            .await
            .with_context(|| format!("while writing input to reference stdin for '{}'", reference_path))?;
        stdin
            .flush()
            .await
            .with_context(|| format!("while flushing stdin to reference for '{}'", reference_path))?;
    }

    let output = child
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
        script_file.write_all(script_content.as_bytes()).unwrap();

        let path_str = script_file.path().to_str().unwrap();
        let result = generate_input(path_str, 42).await;
        assert!(result.is_ok(), "generate_input should succeed for Python script");
        assert_eq!(result.unwrap().trim(), "SEED_42");
    }

    #[tokio::test]
    async fn test_compute_expected_python_script() {
        let mut script_file = NamedTempFile::with_suffix(".py").expect("failed to create temp py file");
        let script_content = r#"import sys
data = sys.stdin.read().strip()
print(f"EXPECTED_{data}")
"#;
        script_file.write_all(script_content.as_bytes()).unwrap();

        let path_str = script_file.path().to_str().unwrap();
        let result = compute_expected(path_str, "INPUT_DATA").await;
        assert!(result.is_ok(), "compute_expected should succeed for Python script");
        assert_eq!(result.unwrap().trim(), "EXPECTED_INPUT_DATA");
    }
}
