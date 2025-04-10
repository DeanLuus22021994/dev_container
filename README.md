# CI/CD Automation

A turnkey, low-code approach to CI/CD automation with DevContainers and VSCode Insiders integration.

## Overview

This project provides a minimal setup for CI/CD automation with focus on:

- Simple Docker containerization
- Streamlined GitHub Actions workflows
- Low-maintenance DevContainer setup
- Essential VS Code extension capabilities
- VSCode Insiders integration with environment variables
- Ollama PHI 4 Mini model support for AI-assisted development

## Getting Started

1. Clone this repository
2. Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```
3. Open in VS Code and use "Reopen in Container" when prompted
4. Run `npm install` if not automatically done

## VSCode Insiders Integration

This project is configured for seamless integration with VSCode Insiders:

1. Ensure you have [VSCode Insiders](https://code.visualstudio.com/insiders/) installed
2. Configure environment variables as listed in `.env.example`
3. Install the Remote - Containers extension in VSCode Insiders
4. Open this project in VSCode Insiders and click "Reopen in Container"

All required extensions for development will be automatically installed in the container.

## Ollama PHI 4 Mini Model Integration

This project comes with Ollama PHI 4 Mini model support:

1. The model is pre-configured in the DevContainer
2. To start the PHI 4 Mini model, use the "ollama: start phi model" task in VS Code
3. The model will be available at http://localhost:11434

## Environment Variables

All necessary environment variables are already configured both on the GitHub repository and locally:
- `PERSONAL_ACCESS_TOKEN` - GitHub Personal Access Token
- `DOCKER_ACCESS_TOKEN` - Docker registry access token
- `DOCKER_USERNAME` - Docker username
- `SSH_DEV_CONTAINER_REPO` - SSH URL to the dev container repository
- `OWNER` - GitHub owner/organization name
- `DOCKER_REGISTRY` - Docker registry URL
- `DOCKER_HOST` - Docker host connection string

## Documentation

See the [docs](docs/) folder for detailed information:
- [CI/CD Setup Guide](docs/cicd-setup.md)
- [Development Guide](docs/development.md)
- [Testing Documentation](docs/testing.md)
- [Troubleshooting](docs/troubleshooting.md)

## Development

- Source code is in the `src/` directory
- Tests are in the `tests/` directory
- Configuration files are in the root directory

## Contributing

Please follow the guidelines in [Development Guide](docs/development.md).
