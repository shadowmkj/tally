// ==============================================================================
// Testcase Generation Pipeline Orchestration
// ==============================================================================

// This module drives the test case generation loop across N iterations.
// For each iteration i, it calculates a deterministic seed (base_seed + i),
// invokes generate_input, computes expected output via the reference solution,
// and constructs the GeneratedTestCase struct with visibility flags.

use crate::generator::{compute_expected, generate_input};
use crate::types::GeneratedTestCase;
use anyhow::{Context, Result};

/// Orchestrates generating `total_count` test cases by sequentially invoking:
/// 1. `generate_input` with deterministic seed `base_seed + i`
/// 2. `compute_expected` with the generated input
///
/// Marks the first `sample_cases` count as visible (`is_hidden = false`) and remaining as hidden.
pub async fn generate_test_suite(
    generator_path: &str,
    reference_path: &str,
    total_count: usize,
    sample_cases: usize,
    base_seed: u64,
) -> Result<Vec<GeneratedTestCase>> {
    let mut suite = Vec::with_capacity(total_count);

    println!(
        "Generating {} test cases using generator '{}' and reference '{}' (base seed: {})...",
        total_count, generator_path, reference_path, base_seed
    );

    for i in 1..=total_count {
        let current_seed = base_seed.wrapping_add(i as u64);

        let input = generate_input(generator_path, current_seed)
            .await
            .with_context(|| format!("while generating test case #{} (seed: {})", i, current_seed))?;

        let expected = compute_expected(reference_path, &input)
            .await
            .with_context(|| format!("while computing expected output for test case #{}", i))?;

        let is_hidden = i > sample_cases;

        suite.push(GeneratedTestCase {
            id: format!("tc-{}", i),
            input,
            expected,
            is_hidden,
        });

        if i % 25 == 0 || i == total_count {
            println!("  Progress: {}/{} test cases generated.", i, total_count);
        }
    }

    Ok(suite)
}
