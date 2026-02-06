FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

# Install PostgreSQL client tools for database operations
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Configure git to trust the workspace directory
RUN git config --global --add safe.directory /workspace

WORKDIR /workspace
