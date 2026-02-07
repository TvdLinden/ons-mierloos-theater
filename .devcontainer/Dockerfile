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

# Create workspace directory and set ownership to node user
RUN chown -R node:node /workspace

# Switch to node user early
USER node

# Copy everything (we'll use .dockerignore to exclude node_modules)
COPY --chown=node:node . .

# Remove any conflicting .npmrc from COPY to use workspace's .npmrc
# The workspace .npmrc will be used instead for consistency with Vercel builds

# Install dependencies as node user
RUN npm install --legacy-peer-deps

# Switch back to root for any remaining setup
USER root

# Pre-create directories for volumes
RUN mkdir -p /workspace/.next \
    /workspace/.turbo \
    && chown -R node:node /workspace

# Switch back to node user for runtime
USER node