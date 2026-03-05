.PHONY: help build run dev test fmt clippy clean start-db stop-db docker-build docker-run docker-dev

# Colors
GREEN := $(shell tput setaf 2 2>/dev/null)
YELLOW := $(shell tput setaf 3 2>/dev/null)
RESET := $(shell tput sgr0 2>/dev/null)

help:
	@echo "$(GREEN)Esotheric Backend - Available Commands$(RESET)"
	@echo ""
	@echo "  $(YELLOW)make build$(RESET)          - Build the backend binary"
	@echo "  $(YELLOW)make run$(RESET)            - Run the server (requires DB)"
	@echo "  $(YELLOW)make dev$(RESET)            - Run with cargo watch (hot reload)"
	@echo "  $(YELLOW)make test$(RESET)           - Run tests"
	@echo "  $(YELLOW)make fmt$(RESET)            - Format code"
	@echo "  $(YELLOW)make clippy$(RESET)         - Run linter"
	@echo "  $(YELLOW)make clean$(RESET)          - Clean build artifacts"
	@echo ""
	@echo "$(GREEN)Docker Commands$(RESET)"
	@echo "  $(YELLOW)make start-db$(RESET)        - Start PostgreSQL and Valkey containers"
	@echo "  $(YELLOW)make stop-db$(RESET)         - Stop Docker containers"
	@echo "  $(YELLOW)make docker-build$(RESET)    - Build production Docker image"
	@echo "  $(YELLOW)make docker-run$(RESET)      - Run production container"
	@echo "  $(YELLOW)make docker-dev$(RESET)      - Run development container with hot reload"
	@echo ""
	@echo "$(GREEN)Database Commands$(RESET)"
	@echo "  $(YELLOW)make migrate$(RESET)         - Run database migrations"
	@echo "  $(YELLOW)make setup-db$(RESET)        - Setup database (start DB + run migrations)"

# Build the backend
build:
	cargo build --release

# Run the server
run: export DATABASE_URL ?= postgres://postgres:postgres@localhost:5432/esotheric
run: export VALKEY_URL ?= redis://localhost:6379
run:
	RUST_LOG=debug cargo run --bin server

# Development with hot reload
dev: export DATABASE_URL ?= postgres://postgres:postgres@localhost:5432/esotheric
dev: export VALKEY_URL ?= redis://localhost:6379
dev:
	RUST_LOG=debug cargo watch -x run

# Run tests
test:
	cargo test

# Format code
fmt:
	cargo fmt --all

# Run linter
clippy:
	cargo clippy --all-targets --all-features -- -D warnings

# Clean build artifacts
clean:
	cargo clean

# Start database containers
start-db:
	docker-compose -f docker-compose.yml up -d
	@echo "$(GREEN)Database started. Waiting for health checks...$(RESET)"
	@sleep 5

# Stop database containers
stop-db:
	docker-compose -f docker-compose.yml down

# Build production Docker image
docker-build:
	docker build -t esotheric-backend:latest .

# Run production container
docker-run:
	docker run -p 3000:3000 \
		-e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/esotheric \
		-e VALKEY_URL=redis://host.docker.internal:6379 \
		-e RUST_ENV=production \
		esotheric-backend:latest

# Run development container with hot reload
docker-dev:
	docker-compose -f docker-compose.dev.yml up --build

# Run database migrations (requires database running)
migrate:
	@echo "$(YELLOW)Note: Ensure database is running with 'make start-db'$(RESET)"
	diesel migration run

# Setup database (start + migrate)
setup-db: start-db migrate

# Generate JWT keys for development
generate-keys:
	@echo "Generating RSA keypair for JWT..."
	@openssl genrsa -out jwt_private.pem 2048 2>/dev/null || openssl genrsa -out jwt_private.pem 2048
	@openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem 2>/dev/null
	@echo "Keys generated. Add these to your .env:"
	@echo "JWT_PRIVATE_KEY_BASE64=$$(base64 -w0 jwt_private.pem)"
	@echo "JWT_PUBLIC_KEY_BASE64=$$(base64 -w0 jwt_public.pem)"
