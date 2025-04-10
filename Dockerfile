FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Accept build arguments for non-sensitive environment variables
ARG DOCKER_HOST
ARG DOCKER_REGISTRY
ARG DOCKER_USERNAME
ARG OWNER
ARG SSH_DEV_CONTAINER_REPO

# Install basic development tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install git curl wget unzip

# Install Docker CLI for connecting to the Docker host
RUN apt-get update && \
    apt-get -y install apt-transport-https ca-certificates curl gnupg lsb-release && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get -y install docker-ce-cli

# Install Ollama - for running PHI 4 Mini model
RUN curl -fsSL https://ollama.com/install.sh | sh

# Install development tools based on mcp.json configuration
RUN npm install -g jest eslint prettier webpack webpack-cli nyc docsify-cli

# Set up a non-root user
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create workspace directory with proper permissions
WORKDIR /app
RUN chown -R $USERNAME:$USERNAME /app

# Pull PHI 4 Mini model
RUN ollama pull phi

# Create startup script to ensure Ollama is running in the background
RUN echo '#!/bin/bash\nollama serve &\nexec "$@"' > /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Set environment variables for non-sensitive information
ENV DOCKER_HOST=$DOCKER_HOST
ENV DOCKER_REGISTRY=$DOCKER_REGISTRY
ENV DOCKER_USERNAME=$DOCKER_USERNAME
ENV OWNER=$OWNER
ENV SSH_DEV_CONTAINER_REPO=$SSH_DEV_CONTAINER_REPO

# Note: Sensitive information like PERSONAL_ACCESS_TOKEN should be mounted at runtime
# rather than included in the image itself

# Expose ports
EXPOSE 3000 11434

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm", "start"]