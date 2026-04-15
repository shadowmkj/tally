use std::fs::read_to_string;

use anyhow::Result;
use clap::Parser;
use crust::models::Job;
use redis::TypedCommands;

#[derive(Parser)]
struct Cli {
    test: Option<String>,
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let client = redis::Client::open("redis://localhost")?;
    let mut conn = client.get_connection()?;
    let value = read_to_string(cli.test.unwrap_or("test.json".to_string()))?;
    let mut json: Job = serde_json::from_str(&value)?;
    for i in 0..20 {
        json.problem_id = i;
        let value = serde_json::to_string(&json)?;
        let _ = conn.lpush("jobs", &value);
    }
    Ok(())
}
