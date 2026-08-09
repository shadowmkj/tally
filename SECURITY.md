# Security Policy

The **Tally** project team takes the security of our platform, automated code execution engine, and user data seriously. This document outlines supported versions, our vulnerability disclosure policy, security architecture principles, and reporting procedures.

---

## 🛡️ Supported Versions

Only the latest active release branches receive security updates and patches.

| Version / Branch | Supported |
| :--- | :--- |
| `main` (latest) | ✅ Yes |
| `dev` | ⚡ Experimental |
| `< 0.1.0` | ❌ No |

---

## 🔒 Security Architecture Overview

Tally evaluates untrusted user-submitted code in competitive programming environments. To protect host systems and user data, the platform enforces multiple defense-in-depth layers:

1. **Isolated Execution Subsystem**:
   - User solutions execute strictly inside ephemeral Docker containers (`python:3.9-slim`, `openjdk:27-ea-slim`, `buildpack-deps:bookworm`).
   - Containers run with strict execution timeouts, CPU limits, and memory limits.

2. **API Authorization & Role Controls**:
   - Administrative API routes (e.g. `/api/problems`, `/api/test-files`) strictly enforce session role checks via `checkAdminAuth`. Unauthenticated or non-admin requests are rejected with HTTP `401 Unauthorized`.

3. **Input Sanitization & Path Traversal Prevention**:
   - All filesystem file references (e.g., test case file uploads) are validated via `isValidFileName` regex allowlists (`/^[a-zA-Z0-9_-]+\.(jsonl|json|txt)$/`) to prevent path traversal (`..`, `/`, `\`) or arbitrary file writing.

4. **Request Payload Validation**:
   - All JSON payloads are parsed within guarded `try / catch` blocks to prevent unhandled process crashes, returning HTTP `400 Bad Request` on malformed inputs.

---

## 📩 Reporting a Vulnerability

If you discover a potential security vulnerability in Tally, **please do not open a public GitHub issue**.

Instead, report it privately to our security maintainers following these steps:

1. **Email Contact**:
   Send a detailed vulnerability report to [`milanpramod123@gmail.com`](mailto:milanpramod123@gmail.com) (or create a private GitHub Security Advisory).

2. **Report Information**:
   Please include as much of the following information as possible:
   - A descriptive summary of the vulnerability.
   - Affected component (e.g. Rust Runner, API Route, Container Driver, Authentication).
   - Step-by-step instructions or Proof of Concept (PoC) code to reproduce the issue.
   - Potential impact of the vulnerability.

3. **Response Timeline**:
   - **Acknowledgment**: Within 48 hours.
   - **Assessment & Triage**: Within 5 business days.
   - **Fix & Disclosure**: Coordinated patch release within 30 days of confirmed triage.

---

## 📋 Security Best Practices for Self-Hosting

When deploying Tally in production environments:

- **Docker Daemon Isolation**: Never run the Docker daemon as root without user namespace remapping (`userns-remap`).
- **Redis Security**: Enable TLS and require strong password authentication (`requirepass`) for Redis.
- **Environment Secrets**: Ensure `BETTER_AUTH_SECRET` and `CODECOV_TOKEN` are set to cryptographically secure random values and kept out of version control.

Thank you for helping keep Tally secure! 🔒
