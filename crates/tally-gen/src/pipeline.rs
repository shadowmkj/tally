// ==============================================================================
// Testcase Generation Pipeline Orchestration
// ==============================================================================

// This module drives the test case generation loop across N iterations.
// For each iteration i, it calculates a deterministic seed (base_seed + i),
// invokes generate_input, computes expected output via the reference solution driver,
// parses values into serde_json::Value structures, and constructs the GeneratedTestCase struct.

use crate::generator::{compute_expected, generate_input};
use crate::types::GeneratedTestCase;
use anyhow::{Context, Result};
use serde_json::Value;

/// Orchestrates generating `total_count` test cases by sequentially invoking:
/// 1. `generate_input` with deterministic seed `base_seed + i`
/// 2. `compute_expected` with the target method name and generated input
/// 3. Parses raw outputs into `serde_json::Value` and constructs the testcase suite.
pub async fn generate_test_suite(
    generator_path: &str,
    reference_path: &str,
    method_name: &str,
    total_count: usize,
    sample_cases: usize,
    base_seed: u64,
) -> Result<Vec<GeneratedTestCase>> {
    let mut suite = Vec::with_capacity(total_count);

    println!(
        "Generating {} test cases using generator '{}' and reference '{}::{}()' (base seed: {})...",
        total_count, generator_path, reference_path, method_name, base_seed
    );

    for i in 1..=total_count {
        let current_seed = base_seed.wrapping_add(i as u64);

        let raw_input = generate_input(generator_path, current_seed)
            .await
            .with_context(|| format!("while generating test case #{} (seed: {})", i, current_seed))?;

        let raw_expected = compute_expected(reference_path, method_name, &raw_input)
            .await
            .with_context(|| format!("while computing expected output for test case #{}", i))?;

        let trimmed_input = raw_input.trim();
        let input_val: Value = serde_json::from_str(trimmed_input)
            .unwrap_or_else(|_| Value::String(trimmed_input.to_string()));

        let trimmed_expected = raw_expected.trim();
        let expected_val: Value = serde_json::from_str(trimmed_expected)
            .unwrap_or_else(|_| Value::String(trimmed_expected.to_string()));

        let is_hidden = i > sample_cases;

        suite.push(GeneratedTestCase {
            id: i,
            input: input_val,
            expected: expected_val,
            is_hidden,
            explanation: None,
        });

        if i % 25 == 0 || i == total_count {
            println!("  Progress: {}/{} test cases generated.", i, total_count);
        }
    }

    Ok(suite)
}
