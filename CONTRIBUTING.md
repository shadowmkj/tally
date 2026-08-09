# Contributing to Tally

Thank you for your interest in contributing to **Tally**! This guide provides an overview of our development setup, coding standards, testing workflows, and Pull Request (PR) guidelines.

---

## 🏗️ Architecture Overview

Tally is a high-performance competitive programming and automated code evaluation platform built with a modern hybrid stack:

- **Backend / Runner**: Written in **Rust**, executing user code inside isolated Docker containers (`python:3.9-slim`, `openjdk:27-ea-slim`, `buildpack-deps:bookworm`) and listening to Redis queues.
- **Frontend / Portal**: Built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM** (SQLite).
- **Authentication**: Handled via **BetterAuth**.
- **Caching & Messaging**: Powered by **Redis**.

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- **Rust**: Minimum supported Rust edition: `2024` (or latest stable toolchain via `rustup`)
- **Node.js**: `v20` or higher
- **pnpm**: `v10` (`npm i -g pnpm@10`)
- **Bun**: `v1.x` (used as the fast test runner for frontend unit & API tests)
- **Docker**: Colima, Docker Desktop, or local Docker daemon
- **Redis**: Local instance or Docker container running on port `6379`

### Environment Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/tally.git
   cd tally
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   pnpm install
   pnpm db:generate
   pnpm db:push
   ```

3. **Environment Configuration**:
   Copy `.env.example` to `.env` in `frontend/`:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

---

## 🚀 Local Development Workflows

### Running the Frontend
Start the Next.js development server:
```bash
cd frontend
pnpm dev
```
The app will be available at `http://localhost:3000`.

### Running the Code Evaluation Runner
Start the Rust runner binary connected to your local Redis instance and SQLite DB:
```bash
cargo run --bin runner -- --listen-queue submissions
```

---

## 🧪 Testing Guidelines

Before submitting a Pull Request, verify that all Rust and Frontend tests pass locally.

> ⚠️ **Note**: Do not run full Docker container execution tests (`cargo test`) repeatedly if you only want to test unit logic. Use the grouped test commands below.

### Frontend Tests (Bun / pnpm)

Run specific test suites based on your changes:

| Command | Description |
| :--- | :--- |
| `pnpm test` | Run all frontend unit and API tests via Bun |
| `pnpm test:fast` | Run quick unit tests (validations, state helpers) |
| `pnpm test:api` | Run Next.js API route integration tests |
| `pnpm test:files` | Run test-files route and file parser tests |

### Rust Backend Tests

- **Run Quick Unit Tests**:
  ```bash
  cargo test --lib
  ```
- **Check Formatting & Clippy Lints**:
  ```bash
  cargo fmt --check
  cargo clippy -- -D warnings
  ```
- **Generate Coverage (Optional)**:
  ```bash
  cargo llvm-cov --all-features --workspace --lcov --output-path lcov.info
  ```

---

## 📐 Coding Conventions

### Commit Messages

Follow standard **Semantic Commits**:
- `feat(scope): add new feature`
- `fix(scope): fix bug or edge case`
- `docs(scope): update documentation`
- `test(scope): add or update test coverage`
- `refactor(scope): internal code cleanup`

### Code Style Rules

1. **Literate Programming**: Explain *why* a complex logic or security check exists, not just *what* the code does.
2. **Error Handling in Rust**:
   - Use `anyhow::Result` or `thiserror` with `.context("description")` on error propagation (`?`).
   - Prefer `expect("explanation why this cannot fail")` over `unwrap()`.
3. **Frontend & Security**:
   - Store global data state (like supported languages) in central configuration files (e.g. `frontend/src/lib/languages.ts`) rather than hardcoding in JSX.
   - Enforce administrator session verification (`checkAdminAuth`) on all sensitive API routes.
   - Validate and sanitize input path names using `isValidFileName` to prevent directory traversal attacks.

---

## 📬 Submitting a Pull Request (PR)

1. Create a feature branch off `dev` or `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Make your changes and commit using semantic commit messages.
3. Ensure all tests and linters pass:
   ```bash
   cargo fmt --check
   cargo clippy -- -D warnings
   cargo test --lib
   cd frontend && pnpm test
   ```
4. Push your branch and open a PR against `main` or `dev`.
5. GitHub Actions will automatically verify:
   - Cargo Formatting & Clippy (`CI`)
   - Rust & Frontend Unit Tests with Coverage (`PR Verification` -> Codecov)

Thank you for helping make Tally better! 🎉
