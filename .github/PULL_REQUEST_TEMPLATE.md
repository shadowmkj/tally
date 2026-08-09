## 📌 Description
A clear and concise summary of the changes introduced in this Pull Request.

Fixes / Closes #(issue_number)

---

## ⚙️ Type of Change
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 💥 Breaking change (fix or feature causing existing functionality to break)
- [ ] 🛠️ Refactoring / Tech Debt (code cleanup, performance optimization, no logic change)
- [ ] 📚 Documentation update
- [ ] 🧪 Test suite improvement / addition

---

## 🔍 Affected Components
- [ ] Frontend / Next.js Admin Studio or Student Portal
- [ ] Rust Code Evaluation Runner (`src/runner.rs`, `src/bin/runner.rs`)
- [ ] Redis Queue Worker & Listener
- [ ] Docker Execution Drivers (Python, Java, C, C++)
- [ ] Database Schema / Prisma ORM
- [ ] CI/CD Workflows (`.github/workflows/`)

---

## 🧪 Testing & Verification
Describe the tests you ran to verify your changes.

### Local Verification Checklist
- [ ] **Rust Unit Tests**: `cargo test --lib` (All tests passing)
- [ ] **Rust Formatting & Clippy**: `cargo fmt --check` & `cargo clippy -- -D warnings`
- [ ] **Frontend Tests**: `cd frontend && pnpm test` (All Bun test suites passing)
- [ ] **Prisma Migration / Client**: `pnpm db:generate` (Clean client generation)

---

## 📸 Screenshots / Recordings (UI Changes Only)
*If your changes modify the frontend UI, please add before/after screenshots or GIF demonstrations.*

---

## 🛡️ Security & Quality Checklist
- [ ] Code follows Literate Programming guidelines (explains *why* logic exists).
- [ ] Sensitive API endpoints enforce administrator authorization (`checkAdminAuth`).
- [ ] User input path references are sanitized using `isValidFileName`.
- [ ] Error messages use `.context()` on Rust error propagation.
- [ ] No hardcoded configuration strings or duplicate inline types.
