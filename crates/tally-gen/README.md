# ⚙️ `tally-gen` — Competitive Programming Test Case Generator

> [!WARNING]
> **UNDER ACTIVE DEVELOPMENT / EXPERIMENTAL**
> 
> `tally-gen` is currently in active development (`v0.1.0-alpha`). Interfaces, command-line arguments, and output schemas may change in future releases. Use with caution in production problem creation pipelines.

---

## 📌 Overview

**`tally-gen`** is a high-performance, CLI testcase generator written in Rust. It automates generating $N$ test cases for competitive programming problems, calculating ground-truth expected outputs via an official reference solution, and exporting formatted test suites.

It includes **Python Driver Integration**, allowing problem authors to write clean `solution.py` files with simple functions (e.g. `def solve(nums, target)` or `def twoSum(...)`) **without needing to parse stdin or format JSON manually**.

---

## 📐 Data Flow & Architecture

```text
                      ┌────────────────────────────┐
                      │   Generator (Script / Bin) │
                      └─────────────┬──────────────┘
                                    │
                         Generate Input (--seed)
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │    TestCase Input String   │
                      └─────────────┬──────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │   Python Driver Wrapper    │
                      │  (Invokes solve(args...))  │
                      └─────────────┬──────────────┘
                                    │
                        TestCase Input + Expected
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │    Exporter & Formatter    │
                      └─────────────┬──────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
   code_tests/two-sum.jsonl      input.txt           tests/01.in & 01.out
   (Tally Standard)         (Single Concatenated)    (Polygon / DOMjudge)
```

---

## ✨ Features

- **🐍 Python Driver Wrapper**: Dynamically imports `solution.py` and invokes `solve(*args)` or `Solution().solve(*args)`, auto-converting inputs and return values.
- **⚡ High-Speed Execution Engine**: Asynchronous process spawning via `tokio::process::Command` with non-blocking standard I/O streaming.
- **🎲 Deterministic Seeding**: Accepts `--seed <u64>` to guarantee 100% reproducible test suites across different machines and environments.
- **👁️ Sample & Hidden Case Flagging**: Automatically flags the first $K$ test cases as sample cases (`is_hidden = false`) and remaining as hidden test cases (`is_hidden = true`).
- **📦 Multi-Format Exporters**:
  - `jsonl`: Newline-delimited JSON objects matching Tally's standard database schema (`{"id": "tc-1", "input": ..., "expected": ..., "is_hidden": false}`).
  - `single`: Single combined input file (`input.txt`) with a total testcase count $T$ header line.
  - `dir`: Directory of paired `.in` and `.out` files (`01.in`, `01.out`, `02.in`, `02.out`) for DOMjudge, Polygon, or CMS.

---

## 🚀 Getting Started

### Prerequisites

- **Rust**: `2024` edition or later (`rustup`)
- **Python**: `3.9+` (if using `.py` generator or reference scripts)

---

## ⌨️ Command Line Usage

```text
Usage: tally-gen [OPTIONS] --generator <GENERATOR> --reference <REFERENCE>

Options:
  -g, --generator <GENERATOR>        Path to generator script or binary (e.g. `generator.py`)
  -r, --reference <REFERENCE>        Path to reference solution script or binary (e.g. `solution.py`)
  -m, --method <METHOD>              Target function/method name in reference solution [default: solve]
  -n, --tests <TESTS>                Total number of test cases to generate [default: 100]
  -s, --seed <SEED>                  Base seed for deterministic random generation [default: 42]
      --sample-cases <SAMPLE_CASES>  Number of sample (visible) test cases [default: 5]
  -o, --output <OUTPUT>              Destination output file path or directory [default: output.jsonl]
  -f, --format <FORMAT>              Target format [default: jsonl] [possible values: jsonl, single, dir]
  -h, --help                         Print help information
  -V, --version                      Print version
```

---

## 📝 Simple Example Workflow

### 1. Minimal Generator Script (`generator.py`)

Outputs standard raw lines (e.g. list and target integer):

```python
import random
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--seed', type=int, required=True)
args = parser.parse_args()

random.seed(args.seed)

print([random.randint(-100, 100) for _ in range(5)])
print(random.randint(-50, 50))
```

### 2. Clean Reference Solution (`solution.py`)

Simple function receiving input parameters directly—**no stdin/stdout parsing required**:

```python
def solve(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
```

### 3. Run `tally-gen`

Generate 100 test cases into Tally JSONL format:

```bash
cargo run --package tally-gen -- \
  --generator generator.py \
  --reference solution.py \
  --method solve \
  --tests 100 \
  --seed 42 \
  --output code_tests/two-sum.jsonl \
  --format jsonl
```

---

## 🧪 Development & Testing

Run subcrate unit tests:

```bash
cargo test --package tally-gen
```

Verify compilation:

```bash
cargo check --package tally-gen
```
