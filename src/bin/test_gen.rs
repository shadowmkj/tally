use std::fs::read_to_string;

use anyhow::Result;
use clap::Parser;
use redis::TypedCommands;

#[derive(Parser)]
struct Cli {
    test: Option<String>,
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let client = redis::Client::open("redis://localhost")?;
    let mut conn = client.get_connection()?;
    let value = read_to_string(cli.test.unwrap_or("test.back.json".to_string()))?;
    let _ = conn.lpush("jobs", &value);
    Ok(())
}
