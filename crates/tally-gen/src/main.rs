mod cli;
mod types;

use clap::Parser;
use cli::Cli;

fn main() {
    let cli = Cli::parse();

    println!("Tally Test Case Generator (tally-gen)");
    println!("  Generator: {}", cli.generator);
    println!("  Reference: {}", cli.reference);
    println!("  Tests: {}", cli.tests);
    println!("  Seed: {}", cli.seed);
    println!("  Sample Cases: {}", cli.sample_cases);
    println!("  Output: {}", cli.output);
    println!("  Format: {:?}", cli.format);
}
