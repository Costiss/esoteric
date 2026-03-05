.PHONY: help install dev web android ios build build:android build:ios docker-build docker-dev docker-dev-stop clean lint format

# Colors
GREEN := $(shell tput setaf 2 2>/dev/null)
YELLOW := $(shell tput setaf 3 2>/dev/null)
RESET := $(shell tput sgr0 2>/dev/null)

help:
	@echo "$(GREEN)Esotheric Mobile - Available Commands$(RESET)"
	@echo ""
	@echo "  $(YELLOW)make install$(RESET)        - Install dependencies"
	@echo "  $(YELLOW)make dev$(RESET)            - Start Expo dev server"
	@echo "  $(YELLOW)make web$(RESET)            - Start web build"
	@echo "  $(YELLOW)make android$(RESET)        - Run on Android"
	@echo "  $(YELLOW)make ios$(RESET)            - Run on iOS"
	@echo "  $(YELLOW)make build$(RESET)          - Generate native projects"
	@echo "  $(YELLOW)make build:android$(RESET)  - Build Android APK"
	@echo "  $(YELLOW)make build:ios$(RESET)      - Build iOS project"
	@echo "  $(YELLOW)make lint$(RESET)           - Run linter"
	@echo "  $(YELLOW)make format$(RESET)         - Format code"
	@echo ""
	@echo "$(GREEN)Docker Commands$(RESET)"
	@echo "  $(YELLOW)make docker-build$(RESET)  - Build Docker image"
	@echo "  $(YELLOW)make docker-dev$(RESET)    - Run in Docker with hot reload"
	@echo "  $(YELLOW)make docker-dev-stop$(RESET) - Stop Docker container"

# Install dependencies
install:
	npm ci

# Start Expo dev server
dev:
	npm run start

# Start web build
web:
	npm run web

# Run on Android
android:
	npm run android

# Run on iOS
ios:
	npm run ios

# Generate native projects (prebuild)
build:
	npm run prebuild

# Build Android APK
build:android:
	expo run:android --variant release

# Build iOS
build:ios:
	expo run:ios

# Run linter
lint:
	npm run lint:biome

# Format code
format:
	npm run format:biome

# Docker build
docker-build:
	docker build -t esotheric-mobile:latest .

# Docker dev with hot reload
docker-dev:
	docker-compose -f docker-compose.dev.yml up --build

# Stop Docker dev
docker-dev-stop:
	docker-compose -f docker-compose.dev.yml down

# Clean node_modules and build artifacts
clean:
	rm -rf node_modules
	rm -rf android ios
	rm -rf .expo
	rm -rf dist

# TypeScript check
typecheck:
	npx tsc --noEmit
