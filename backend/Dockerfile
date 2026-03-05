# Build stage
FROM rust:1.82-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy workspace files
COPY Cargo.toml ./
COPY crates ./crates

# Build dependencies first (for caching)
RUN mkdir -p crates/common crates/db crates/auth crates/users crates/providers crates/services crates/bookings payments notifications admin && \
    cargo build --release --package backend && \
    cargo build --release --bin server

# Final stage - minimal runtime
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash appuser

WORKDIR /home/appuser

# Copy binary from builder
COPY --from=builder /build/target/release/server .

# Copy static assets if any
# COPY --from=builder /build/target/release/static ./static

# Environment variables
ENV RUST_LOG=info
ENV RUST_ENV=production

# Expose port
EXPOSE 3000

# Switch to non-root user
USER appuser

# Run the server
CMD ["./server"]
