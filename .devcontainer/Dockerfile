FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Set ARGs and ENVs for better build caching and reproducibility
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ARG DEBIAN_FRONTEND=noninteractive

# Set labels for better image management
LABEL maintainer="deanluus22021994" \
      description="Dev container for CI/CD automation projects" \
      version="1.0.0" \
      org.opencontainers.image.source="https://github.com/deanluus22021994/cicd_automation"

# Prevent apt from showing prompts
ENV DEBIAN_FRONTEND=noninteractive

# Set shell to bash during build for more predictable behavior
SHELL ["/bin/bash", "-c"]

# Install additional packages with BuildKit cache support
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt-get update && \
    apt-get -y install --no-install-recommends \
        bash-completion \
        curl \
        git \
        gnupg \
        htop \
        jq \
        less \
        lsb-release \
        make \
        nano \
        procps \
        ssh \
        unzip \
        vim \
        wget \
        zsh \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Conditionally install Oh My Zsh only if not already installed
RUN if [ ! -d "/root/.oh-my-zsh" ]; then \
      echo "Installing Oh My Zsh..." && \
      sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended || true; \
    else \
      echo "Oh My Zsh is already installed, skipping installation"; \
    fi

# Install Node.js and related tools with BuildKit cache
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    --mount=type=cache,target=/root/.npm \
    set -e && \
    echo "Installing Node.js and related tools..." && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    npm install -g npm@latest yarn pnpm typescript nodemon && \
    HUSKY_SKIP_INSTALL=1 npm install -g husky && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/*

# Create development folders and set proper permissions
RUN mkdir -p /workspace /home/$USERNAME/.cache/yarn && \
    chown -R $USER_UID:$USER_GID /workspace /home/$USERNAME/.cache

# Copy the centralized .env file from project root into the container
COPY .env /workspace/.env

# Ensure the .env file is loaded in the container
RUN echo 'if [ -f "/workspace/.env" ]; then set -a; source /workspace/.env; set +a; fi' >> /etc/profile

# Switch to the vscode user
USER $USERNAME

# Setup workspace directory
WORKDIR /workspace

# Install global development packages with npm cache configured
RUN --mount=type=cache,target=/home/$USERNAME/.npm \
    npm config set cache /home/$USERNAME/.cache/npm && \
    npm install -g eslint prettier typescript-language-server && \
    echo "Global packages installed successfully"

# Set environment variables
ENV HUSKY=0 \
    HUSKY_SKIP_INSTALL=1 \
    PATH="/home/$USERNAME/.local/bin:/home/$USERNAME/bin:/workspace/node_modules/.bin:${PATH}" \
    NODE_ENV=development \
    DOCKER_BUILDKIT=1 \
    COMPOSE_DOCKER_CLI_BUILD=1 \
    BUILDKIT_PROGRESS=plain

# Setup ZSH with Powerlevel10k theme
RUN set -e && \
    echo "Setting up Powerlevel10k theme..." && \
    if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k" ]; then \
        git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k || echo "Warning: Could not clone powerlevel10k theme"; \
    fi && \
    if [ -f "$HOME/.zshrc" ]; then \
        sed -i 's/ZSH_THEME="robbyrussell"/ZSH_THEME="powerlevel10k\/powerlevel10k"/g' ~/.zshrc || true; \
        echo '\n# Powerlevel10k config\nPOWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true' >> ~/.zshrc; \
    else \
        echo "Warning: .zshrc not found, skipping theme setup"; \
    fi

# Add useful aliases and path settings
RUN if [ -f "$HOME/.zshrc" ]; then \
        echo '\n# Aliases\nalias ll="ls -lah"\nalias gs="git status"\nalias gc="git commit"\nalias gp="git push"\nalias gl="git pull"\n' >> ~/.zshrc; \
        echo '\n# Path settings\nexport PATH=$PATH:$HOME/.local/bin:$HOME/bin:/workspace/node_modules/.bin\n' >> ~/.zshrc; \
    else \
        echo "Warning: .zshrc not found, skipping alias setup"; \
    fi

# Verify critical installations
RUN echo "Verifying installations..." && \
    command -v node && node --version && \
    command -v npm && npm --version && \
    command -v git && git --version && \
    echo "All critical dependencies verified successfully."

# Set default shell to zsh
SHELL ["/bin/zsh", "-c"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1