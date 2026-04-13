use bollard::Docker;
use bollard::container::{
    AttachContainerOptions, AttachContainerResults, Config, CreateContainerOptions,
    RemoveContainerOptions, StartContainerOptions,
};
use bollard::models::HostConfig;
use futures_util::StreamExt;
use std::io::Write;
use std::path::{Path, PathBuf};
use tokio::io::AsyncWriteExt;

use crate::judger;
use crate::models::{DriverResponse, Language, TestCase, Verdict};

/// Returns the root directory of the crate (where Cargo.toml lives).
fn crate_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).to_path_buf()
}

/// Build a temporary working directory that contains:
///   - The language-specific driver (copied from the crate's src/ tree)
///   - The user's solution code written as the appropriate solution file
///
/// Returns the `TempDir` handle — dropping it cleans up the directory.
fn prepare_workspace(
    language: &Language,
    solution_code: &str,
) -> Result<tempfile::TempDir, Box<dyn std::error::Error>> {
    let dir = tempfile::tempdir()?;
    let root = crate_root();

    match language {
        Language::Python => {
            // Copy driver.py from the crate's python_driver directory
            let driver_src = root.join("src/python_driver/driver.py");
            std::fs::copy(&driver_src, dir.path().join("driver.py"))?;

            // Write the user's solution
            let mut f = std::fs::File::create(dir.path().join("solution.py"))?;
            f.write_all(solution_code.as_bytes())?;
        }
        Language::Java => {
            // Copy Driver.java and lib/ from the crate's java_driver directory
            let java_driver_dir = root.join("src/java_driver");

            std::fs::copy(
                java_driver_dir.join("Driver.java"),
                dir.path().join("Driver.java"),
            )?;

            // Copy the lib/ directory with Jackson JARs
            let lib_src = java_driver_dir.join("lib");
            if lib_src.exists() {
                let lib_dst = dir.path().join("lib");
                std::fs::create_dir_all(&lib_dst)?;
                for entry in std::fs::read_dir(&lib_src)? {
                    let entry = entry?;
                    std::fs::copy(entry.path(), lib_dst.join(entry.file_name()))?;
                }
            }

            // Write the user's solution
            let mut f = std::fs::File::create(dir.path().join("Solution.java"))?;
            f.write_all(solution_code.as_bytes())?;
        }
    }

    Ok(dir)
}

/// Run a single test case inside a Docker container and return the judging verdict.
///
/// `solution_code` — the raw source code of the user's solution.
/// A temporary workspace is created with the driver + this code, mounted
/// into the container, and cleaned up automatically after execution.
pub async fn execute_submission(
    docker: &Docker,
    test_case: TestCase,
    language: &Language,
    method_name: &str,
    solution_code: &str,
) -> Result<Verdict, Box<dyn std::error::Error>> {
    // 1. Build a temp workspace with driver + user solution
    let workspace = prepare_workspace(language, solution_code)?;
    let workspace_path = workspace.path().to_string_lossy().into_owned();

    // 2. Resolve language-specific image and command
    let (image, cmd): (&str, Vec<String>) = match language {
        Language::Python => {
            let cmd = vec![
                "python".to_string(),
                "driver.py".to_string(),
                method_name.to_string(),
            ];
            ("python:3.9-slim", cmd)
        }
        Language::Java => {
            // Java needs two steps: compile (javac) then run (java).
            // The workspace is mounted read-only at /app, so we copy
            // sources to a writable /work directory, compile there, then run.
            let shell_cmd = format!(
                "mkdir -p /work && \
                 cp /app/*.java /work/ && cp -r /app/lib /work/ && \
                 cd /work && \
                 javac -cp '.:lib/*' Driver.java Solution.java && \
                 java -cp '.:lib/*' Driver {}",
                method_name
            );
            let cmd = vec!["sh".to_string(), "-c".to_string(), shell_cmd];
            ("openjdk:27-ea-slim", cmd)
        }
    };

    let bind = format!("{}:/app:ro", workspace_path);

    // 3. Configure the Container (Strict Security Limits!)
    let host_config = HostConfig {
        memory: Some(256 * 1024 * 1024),          // 256 MB RAM limit
        memory_swap: Some(256 * 1024 * 1024),     // Disable swap
        network_mode: Some(String::from("none")), // NO INTERNET ACCESS
        binds: Some(vec![bind]),                  // Mount workspace as read-only
        ..Default::default()
    };

    let container_config = Config {
        image: Some(image.to_string()),
        host_config: Some(host_config),
        cmd: Some(cmd),
        working_dir: Some("/app".to_string()),
        attach_stdin: Some(true),
        attach_stdout: Some(true),
        attach_stderr: Some(true),
        open_stdin: Some(true),    // Keep stdin open so we can pipe to it
        stdin_once: Some(true),    // Close stdin after the first attach disconnects (signals EOF)
        ..Default::default()
    };

    // 4. Create the Container (Docker auto-assigns a unique name)
    let container = docker
        .create_container(None::<CreateContainerOptions<String>>, container_config)
        .await?;
    let container_id = container.id;

    // 5. Attach to the Container's IO Streams BEFORE starting.
    // This avoids a race condition where the container produces output
    // before our attach request is processed, causing us to miss it.
    let AttachContainerResults { mut output, input } = docker
        .attach_container(
            &container_id,
            Some(AttachContainerOptions::<String> {
                stdin: Some(true),
                stdout: Some(true),
                stderr: Some(true),
                stream: Some(true),
                ..Default::default()
            }),
        )
        .await?;

    // 6. NOW start the container — the attach streams are already connected.
    docker
        .start_container(&container_id, None::<StartContainerOptions<String>>)
        .await?;

    // 7. Pipe the JSON input into the container via a spawned task.
    // We must write stdin and read stdout concurrently to avoid deadlocks.
    // Dropping `input` after writing signals EOF to the container's stdin,
    // which lets the driver's `for line in sys.stdin` loop terminate.
    let input_payload = serde_json::to_string(&test_case.input)? + "\n";

    tokio::spawn(async move {
        let mut input = input;
        if let Err(e) = input.write_all(input_payload.as_bytes()).await {
            eprintln!("stdin write error: {:#?}", e);
        }
        if let Err(e) = input.shutdown().await {
            eprintln!("stdin shutdown error: {:#?}", e);
        }
        // `input` is dropped here, closing the container's stdin pipe.
    });

    // 8. Read the Results from stdout and judge
    let mut verdict = Verdict::NoOutput;

    while let Some(res) = output.next().await {
        if let Ok(log_output) = res {
            match log_output {
                bollard::container::LogOutput::StdOut { message } => {
                    let stdout_str = String::from_utf8_lossy(&message);
                    println!("Raw Container Output: {}", stdout_str);

                    if let Ok(driver_res) = serde_json::from_str::<DriverResponse>(&stdout_str) {
                        verdict = judger::judge(&driver_res, &test_case.expected);
                    }
                }
                bollard::container::LogOutput::StdErr { message } => {
                    let stderr_str = String::from_utf8_lossy(&message);
                    eprintln!("System Error Output: {}", stderr_str);
                }
                _ => {}
            }
        }
    }

    // 9. Cleanup: Destroy the container immediately after execution.
    docker
        .remove_container(
            &container_id,
            Some(RemoveContainerOptions {
                force: true,
                ..Default::default()
            }),
        )
        .await?;

    // workspace (TempDir) is dropped here, cleaning up the temp directory.
    println!("Container {} finished.", &container_id[..12]);

    Ok(verdict)
}
