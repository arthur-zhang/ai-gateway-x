#!/usr/bin/env just --justfile

# Start the gateway service
run:
   DATABASE_URL="sqlite:./sessions.db" cargo run --bin gateway

# Run the gateway in release mode
run-release:
    cargo run --bin gateway --release
    
# Build the gateway
build:
    cargo build --bin gateway

# Build the gateway in release mode  
build-release:
    cargo build --bin gateway --release

# Clean build artifacts
clean:
    cargo clean