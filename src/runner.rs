use bollard::container::{
    AttachContainerOptions, AttachContainerResults, Config, CreateContainerOptions,
    RemoveContainerOptions, StartContainerOptions,
};
use bollard::models::HostConfig;
use bollard::Docker;
use futures_util::StreamExt;
use tokio::io::AsyncWriteExt;

use crate::judger;
use crate::models::{DriverResponse, Language, TestCase, Verdict};

/// Run a single test case inside a Docker container and return the judging verdict.
///
/// `driver_dir_override` — if `Some`, use this path as the driver directory
/// instead of deriving it from `std::env::current_dir()`. This is used by
/// tests to point at temporary fixture directories.
pub async fn execute_submission(
    docker: &Docker,
    test_case: TestCase,
    language: &Language,
    method_name: &str,
    driver_dir_override: Option<&str>,
) -> Result<Verdict, Box<dyn std::error::Error>> {
    let container_name = format!("exec_{}", test_case.id);

    // 1. Resolve language-specific container configuration
    let current_dir = std::env::current_dir()?;

    let (image, driver_subdir, cmd): (&str, &str, Vec<String>) = match language {
        Language::Python => {
            let cmd = vec![
                "python".to_string(),
                "driver.py".to_string(),
                method_name.to_string(),
            ];
            ("python:3.9-slim", "src/python_driver", cmd)
        }
        Language::Java => {
            let cmd = vec![
                "java".to_string(),
                "-cp".to_string(),
                ".:lib/*".to_string(),
                "Driver".to_string(),
                method_name.to_string(),
            ];
            ("openjdk:17-slim", "src/java_driver", cmd)
        }
    };

    let driver_dir = match driver_dir_override {
        Some(path) => std::path::PathBuf::from(path),
        None => current_dir.join(driver_subdir),
    };
    let driver_dir_str = driver_dir.to_string_lossy().into_owned();
    let bind = format!("{}:/app:ro", driver_dir_str);

    // 2. Configure the Container (Strict Security Limits!)
    let host_config = HostConfig {
        memory: Some(256 * 1024 * 1024),          // 256 MB RAM limit
        memory_swap: Some(256 * 1024 * 1024),     // Disable swap
        network_mode: Some(String::from("none")), // NO INTERNET ACCESS
        binds: Some(vec![bind]),                  // Mount driver directory as read-only
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

    // 3. Create the Container
    docker
        .create_container(
            Some(CreateContainerOptions {
                name: container_name.clone(),
                platform: None,
            }),
            container_config,
        )
        .await?;

    // 4. Attach to the Container's IO Streams BEFORE starting.
    // This avoids a race condition where the container produces output
    // before our attach request is processed, causing us to miss it.
    let AttachContainerResults { mut output, input } = docker
        .attach_container(
            &container_name,
            Some(AttachContainerOptions::<String> {
                stdin: Some(true),
                stdout: Some(true),
                stderr: Some(true),
                stream: Some(true),
                ..Default::default()
            }),
        )
        .await?;

    // 5. NOW start the container — the attach streams are already connected.
    docker
        .start_container(&container_name, None::<StartContainerOptions<String>>)
        .await?;

    // 6. Pipe the JSON input into the container via a spawned task.
    // We must write stdin and read stdout concurrently to avoid deadlocks.
    // Dropping `input` after writing signals EOF to the container's stdin,
    // which lets the Python driver's `for line in sys.stdin` loop terminate.
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

    // 7. Read the Results from stdout and judge
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

    // 8. Cleanup: Destroy the container immediately after execution.
    docker
        .remove_container(
            &container_name,
            Some(RemoveContainerOptions {
                force: true,
                ..Default::default()
            }),
        )
        .await?;

    println!("Container {} finished.", container_name);

    Ok(verdict)
}
