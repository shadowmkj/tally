use anyhow::Result;
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
use crate::models::{DriverResponse, Language, TestCase, TestCaseResult, Verdict};

/// Returns the root directory of the crate (where Cargo.toml lives).
fn crate_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).to_path_buf()
}

/// Build a temporary working directory that contains:
///   - The language-specific driver (copied from the crate's src/ tree)
///   - The user's solution code written as the appropriate solution file
///
/// Returns the `TempDir` handle — dropping it cleans up the directory.
fn prepare_workspace(language: &Language, solution_code: &str, method_name: &str, type_schema: Option<&str>) -> Result<tempfile::TempDir> {
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
        Language::C => {
            let c_driver_dir = root.join("src/c_driver");
            std::fs::copy(c_driver_dir.join("driver.c"), dir.path().join("driver.c"))?;
            std::fs::copy(c_driver_dir.join("cJSON.c"), dir.path().join("cJSON.c"))?;
            std::fs::copy(c_driver_dir.join("cJSON.h"), dir.path().join("cJSON.h"))?;

            let mut f = std::fs::File::create(dir.path().join("solution.c"))?;
            f.write_all(solution_code.as_bytes())?;
        }
        Language::Cpp => {
            let cpp_driver_dir = root.join("src/cpp_driver");
            std::fs::copy(cpp_driver_dir.join("json.hpp"), dir.path().join("json.hpp"))?;

            let mut f = std::fs::File::create(dir.path().join("solution.cpp"))?;
            f.write_all(solution_code.as_bytes())?;

            let driver_code = generate_cpp_driver(method_name, type_schema.unwrap_or(""));
            let mut f_d = std::fs::File::create(dir.path().join("driver.cpp"))?;
            f_d.write_all(driver_code.as_bytes())?;
        }
    }

    Ok(dir)
}

/// Run ALL test cases inside a single Docker container and return results.
///
/// The driver reads test inputs line-by-line from stdin and writes one JSON
/// response per line to stdout. We send all inputs at once, then read
/// responses in order, judging each against the expected output.
///
/// Execution stops early on the first non-Accepted verdict. The returned
/// vector contains results up to and including that failure (or all results
/// if every test case passes).
pub async fn run_all(
    docker: &Docker,
    test_cases: Vec<TestCase>,
    language: &Language,
    method_name: &str,
    type_schema: Option<&str>,
    solution_code: &str,
) -> Result<Vec<TestCaseResult>> {
    if test_cases.is_empty() {
        return Ok(vec![]);
    }

    // 1. Build a temp workspace with driver + user solution
    let workspace = prepare_workspace(language, solution_code, method_name, type_schema)?;
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
        Language::C => {
            let default_schema = "[i],i:[i]";
            let schema = type_schema.unwrap_or(default_schema);
            let shell_cmd = format!(
                "mkdir -p /work && \
                 cp /app/* /work/ && cd /work && \
                 gcc -shared -fPIC -o solution.so solution.c && \
                 gcc -o driver driver.c cJSON.c -ldl -lffi && \
                 ./driver {} '{}'",
                method_name, schema
            );
            let cmd = vec!["sh".to_string(), "-c".to_string(), shell_cmd];
            ("buildpack-deps:bookworm", cmd)
        }
        Language::Cpp => {
            let shell_cmd = "mkdir -p /work && \
                             cp /app/* /work/ && cd /work && \
                             g++ -O0 -std=c++20 -o driver driver.cpp && \
                             ./driver"
                .to_string();
            let cmd = vec!["sh".to_string(), "-c".to_string(), shell_cmd];
            ("buildpack-deps:bookworm", cmd)
        }
    };

    let bind = format!("{}:/app:ro", workspace_path);

    // 3. Configure the Container (Strict Security Limits!)
    let host_config = HostConfig {
        memory: Some(512 * 1024 * 1024),          // 512 MB RAM limit
        memory_swap: Some(512 * 1024 * 1024),     // Disable swap
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
        open_stdin: Some(true), // Keep stdin open so we can pipe to it
        stdin_once: Some(true), // Close stdin after the first attach disconnects (signals EOF)
        ..Default::default()
    };

    // 4. Create the Container (Docker auto-assigns a unique name)
    let container = docker
        .create_container(None::<CreateContainerOptions<String>>, container_config)
        .await?;
    let container_id = container.id;

    // 5. Attach to the Container's IO Streams BEFORE starting.
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

    // 7. Send ALL test case inputs at once (one JSON line per test case),
    //    then close stdin so the driver knows there's no more input.
    let mut payload = String::new();
    for tc in &test_cases {
        payload.push_str(&serde_json::to_string(&tc.input)?);
        payload.push('\n');
    }

    tokio::spawn(async move {
        let mut input = input;
        if let Err(e) = input.write_all(payload.as_bytes()).await {
            eprintln!("stdin write error: {:#?}", e);
        }
        if let Err(e) = input.shutdown().await {
            eprintln!("stdin shutdown error: {:#?}", e);
        }
    });

    // 8. Read responses from stdout and judge each against the corresponding test case.
    //    The driver outputs one JSON line per input, in the same order.
    let mut results: Vec<TestCaseResult> = Vec::with_capacity(test_cases.len());
    let mut tc_iter = test_cases.iter();
    let mut failed = false;

    let timeout_duration = std::time::Duration::from_secs(30);
    let mut is_tle = false;

    loop {
        match tokio::time::timeout(timeout_duration, output.next()).await {
            Ok(Some(res)) => {
                if let Ok(log_output) = res {
                    match log_output {
                        bollard::container::LogOutput::StdOut { message } => {
                            let stdout_str = String::from_utf8_lossy(&message);

                            // stdout may contain multiple lines in a single chunk
                            for line in stdout_str.lines() {
                                let line = line.trim();
                                if line.is_empty() {
                                    continue;
                                }

                                if let Ok(driver_res) = serde_json::from_str::<DriverResponse>(line)
                                {
                                    if let Some(tc) = tc_iter.next() {
                                        let verdict = judger::judge(&driver_res, &tc.expected);
                                        let is_failure = verdict != Verdict::Accepted;

                                        results.push(TestCaseResult { id: tc.id, verdict });

                                        if is_failure {
                                            failed = true;
                                            break;
                                        }
                                    }
                                }
                            }

                            if failed {
                                break;
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
            Ok(None) => {
                // Stream ended normally
                break;
            }
            Err(_) => {
                // Timeout elapsed!
                is_tle = true;
                break;
            }
        }
    }

    // If we got fewer responses than test cases (e.g., driver crashed mid-run or TLE),
    // mark the next unprocessed test case appropriately.
    if !failed {
        if let Some(tc) = tc_iter.next() {
            let verdict = if is_tle {
                Verdict::TimeLimitExceeded
            } else {
                Verdict::NoOutput
            };

            results.push(TestCaseResult { id: tc.id, verdict });
        }
    }

    // 9. Cleanup: Destroy the container immediately.
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

    Ok(results)
}

fn generate_cpp_driver(method_name: &str, type_schema: &str) -> String {
    let parts: Vec<&str> = type_schema.split(':').collect();
    let in_schema = parts.first().copied().unwrap_or("");
    let ret_schema = parts.get(1).copied().unwrap_or("v");

    let in_tokens: Vec<&str> = if in_schema.is_empty() {
        vec![]
    } else {
        in_schema.split(',').collect()
    };

    let mut args_decl = String::new();
    let mut args_list = String::new();

    for (i, tok) in in_tokens.iter().enumerate() {
        let cpp_type = match *tok {
            "i" | "b" => "int",
            "d" => "double",
            "s" => "std::string",
            "[i]" => "std::vector<int>",
            "[s]" => "std::vector<std::string>",
            "[d]" => "std::vector<double>",
            _ => "int",
        };

        args_decl.push_str(&format!("                auto arg{} = curr.value().get<{}>();\n                curr++;\n", i, cpp_type));
        if i > 0 { args_list.push_str(", "); }
        args_list.push_str(&format!("arg{}", i));
    }

    let call_stmt = if ret_schema == "v" {
        format!("                sol.{}({});\n                resp[\"result\"] = nullptr;\n", method_name, args_list)
    } else {
        format!("                auto result = sol.{}({});\n                resp[\"result\"] = result;\n", method_name, args_list)
    };

    format!(r#"
#include <iostream>
#include <string>
#include <vector>
#include "json.hpp"
#include "solution.cpp"

using json = nlohmann::ordered_json;

void print_error(const std::string& msg) {{
    json resp;
    resp["success"] = false;
    resp["error"] = msg;
    std::cout << resp.dump() << std::endl;
}}

int main() {{
    std::string line;
    while (std::getline(std::cin, line)) {{
        if (line.empty()) continue;
        try {{
            json root = json::parse(line);
            Solution sol;
            auto curr = root.begin();
{args_decl}
            json resp;
            resp["success"] = true;
{call_stmt}
            std::cout << resp.dump() << std::endl;
        }} catch(const std::exception& e) {{
            print_error(e.what());
        }}
    }}
    return 0;
}}
"#, args_decl=args_decl, call_stmt=call_stmt)
}
