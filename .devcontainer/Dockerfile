FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

# Install PostgreSQL client tools for database operations
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Allow node user to run sudo without password for setup scripts
RUN echo "node ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/node

# Configure git to trust the workspace directory
RUN git config --global --add safe.directory /workspace

WORKDIR /workspace

# Pre-create directories and set ownership for volumes
RUN mkdir -p /workspace/node_modules \
    /workspace/.next \
    /workspace/.turbo \
    && chown -R node:node /workspace
