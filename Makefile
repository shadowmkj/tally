.PHONY: dev dev-frontend dev-runner build test check clean help

# Default target
.DEFAULT_GOAL := help

help:
	@echo "Available make targets:"
	@echo "  make dev          - Run both Next.js frontend and Rust runner daemon concurrently"
	@echo "  make dev-frontend - Run Next.js frontend dev server (http://localhost:3000)"
	@echo "  make dev-runner   - Run Rust code runner daemon listening on Redis queue 'jobs'"
	@echo "  make build        - Build Rust workspace and Next.js frontend"
	@echo "  make test         - Run all test suites (Rust + Frontend)"
	@echo "  make check        - Run cargo clippy & workspace checks"
	@echo "  make clean        - Stop and prune Docker containers"

# Run frontend (Next.js) and backend (Rust runner) concurrently in a single terminal
dev:
	@echo "Starting Tally Frontend and Rust Runner daemon concurrently..."
	@npx -y concurrently -k -n "FRONTEND,RUNNER" -c "cyan,yellow" \
		"cd frontend && pnpm dev" \
		"cargo run --package tally --bin runner -- --listen-queue jobs"

# Run frontend dev server only
dev-frontend:
	@cd frontend && pnpm dev

# Run backend runner daemon only
dev-runner:
	@cargo run --package tally --bin runner -- --listen-queue jobs

# Build all workspace components
build:
	@echo "Building Rust workspace binaries..."
	@cargo build --workspace
	@echo "Building Next.js frontend..."
	@cd frontend && pnpm build

# Run all workspace test suites
test:
	@echo "Running Rust test suites..."
	@cargo test --workspace
	@echo "Running Frontend unit tests..."
	@cd frontend && pnpm test

# Code quality checks
check:
	@cargo clippy --workspace --all-targets

# Cleanup Docker containers
clean:
	@echo "Cleaning up Docker containers..."
	-docker stop $$(docker ps -aq) 2>/dev/null || true
	-docker rm $$(docker ps -aq) 2>/dev/null || true
	-docker container prune -f
