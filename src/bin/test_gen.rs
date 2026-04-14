use std::fs::read_to_string;

use anyhow::Result;
use crust::models::Job;
use redis::TypedCommands;

fn main() -> Result<()> {
    let client = redis::Client::open("redis://localhost")?;
    let mut conn = client.get_connection()?;
    let value = read_to_string("test.json")?;
    let mut json: Job = serde_json::from_str(&value)?;
    for i in 0..20 {
        json.problem_id = i;
        let value = serde_json::to_string(&json)?;
        let _ = conn.lpush("jobs", &value);
    }
    Ok(())
}
