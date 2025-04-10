# CI/CD Setup Documentation

This document provides instructions for configuring the CI/CD automation environment for devcontainer development.

## Required Environment Variables

The following environment variables are required for the CI/CD workflows to function properly:

| Variable | Description | Local Setup | GitHub Setup |
|----------|-------------|-------------|-------------|
| `PERSONAL_ACCESS_TOKEN` | GitHub Personal Access Token with repo, workflow, packages permissions | Set in `.env` file | Set as repository secret |
| `DOCKER_ACCESS_TOKEN` | Docker Hub or Container Registry authentication token | Set in `.env` file | Set as repository secret |
| `DOCKER_USERNAME` | Username for Docker Hub or Container Registry | Set in `.env` file | Set as repository secret |
| `DOCKER_REGISTRY` | URL of the Docker registry (e.g., ghcr.io, docker.io) | Set in `.env` file | Set as repository secret |
| `DOCKER_HOST` | Docker daemon host (optional for remote Docker operations) | Set in `.env` file | Set as repository secret |
| `SSH_DEV_CONTAINER_REPO` | SSH URL for development container repository | Set in `.env` file | Set as repository secret |
| `OWNER` | GitHub owner/organization name | Set in `.env` file | Set as repository secret |

## Setting Up Environment Variables

### Local Environment Setup

1. Create a `.env` file in the root of the project with the following structure:

```bash
# DEVCONTAINER AUTOMATION - ENVIRONMENT CONFIGURATION
# =====================================================
# Configuration for personal devcontainer automation builds

# REQUIRED DEVCONTAINER VARIABLES
PERSONAL_ACCESS_TOKEN=your_github_pat_here
DOCKER_ACCESS_TOKEN=your_docker_access_token
DOCKER_USERNAME=your_docker_username
DOCKER_REGISTRY=ghcr.io  # or your preferred registry
DOCKER_HOST=tcp://localhost:2375  # optional, only if using remote Docker
SSH_DEV_CONTAINER_REPO=git@github.com:username/repo.git
OWNER=your_github_username_or_org

# GITHUB ACTIONS ENVIRONMENT SIMULATION (for act)
GITHUB_ACTIONS=true
GITHUB_WORKSPACE=/home/runner/work/cicd_automation/cicd_automation
GITHUB_REPOSITORY=your_github_username_or_org/cicd_automation
GITHUB_REPOSITORY_OWNER=your_github_username_or_org
GITHUB_SHA=0000000000000000000000000000000000000000
GITHUB_REF=refs/heads/main
GITHUB_EVENT_NAME=push
GITHUB_TOKEN=fake_github_token_for_local_testing

# JEST TESTING CONFIGURATION
NODE_ENV=test
JEST_WORKER_ID=1
COLLECT_COVERAGE=false
JEST_TIMEOUT=30000
USE_ACTUAL_CONTAINERS=false
CLEANUP_TEST_IMAGES=false
```

1. Load these variables into your local environment:

```bash
# On Windows (PowerShell)
Get-Content .env | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# On Linux/Mac
export $(grep -v '^#' .env | xargs)
```

### GitHub Repository Setup

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click on "New repository secret"
4. Add each of the required variables as secrets with their corresponding values

## Validating Environment Variables

You can validate that your environment variables are correctly set up by running:

```bash
# Using the validation script
node scripts/validate-env.js
```

This script will check that all required environment variables are set and provide guidance if any are missing.

## Testing Workflows Locally with Act

You can test GitHub Actions workflows locally using [Act](https://github.com/nektos/act):

```bash
# Install Act (on Windows with Chocolatey)
choco install act-cli -y

# Test the validate-env job
act -j validate-env --secret-file .env

# Test the build-and-test job
act -j build-and-test --secret-file .env

# Test the devcontainer-build job
act -j devcontainer-build --secret-file .env
```

## CI/CD Workflow Overview

Our CI/CD automation includes the following workflow:

### Devcontainer Automation Workflow

This workflow is defined in `.github/workflows/agent-workflow.yml` and consists of three main jobs:

1. **validate-env**:
   - Validates all required environment variables
   - Ensures configuration is correct before proceeding

2. **build-and-test**:
   - Installs dependencies
   - Runs linting
   - Executes unit tests with Jest
   - Runs integration tests
   - Compiles the code
   - Creates build artifacts

3. **devcontainer-build**:
   - Uses build artifacts to create a Docker image
   - Pushes the image to the container registry
   - Tags images appropriately based on the source branch

## Workflow Trigger Events

The workflow is triggered by:

- Push events to `main` and `develop` branches (only when specific paths change)
- Pull requests to `main` and `develop` branches (only when specific paths change)
- Manual workflow dispatch

## Troubleshooting

If you encounter issues with the CI/CD workflows, please refer to the [Troubleshooting Guide](troubleshooting.md) for common issues and their solutions.

---

Last Updated: April 10, 2025
