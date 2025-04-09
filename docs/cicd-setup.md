# CI/CD Setup Documentation

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

1. Create a `.env` file in the root of the project (if not already existing)
2. Add the following variables to your `.env` file:

```bash
PERSONAL_ACCESS_TOKEN=your_github_pat_here
DOCKER_ACCESS_TOKEN=your_docker_access_token
DOCKER_USERNAME=your_docker_username
DOCKER_REGISTRY=ghcr.io  # or your preferred registry
DOCKER_HOST=tcp://localhost:2375  # optional, only if using remote Docker
SSH_DEV_CONTAINER_REPO=git@github.com:username/repo.git
OWNER=your_github_username_or_org
```

3. Load these variables into your local environment:

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
4. Add each of the above variables as secrets with their corresponding values

## Validating Environment Variables

You can validate that your environment variables are correctly set up by running:

```bash
# Local validation
node -e "console.log('PERSONAL_ACCESS_TOKEN:', process.env.PERSONAL_ACCESS_TOKEN ? 'Set ✓' : 'Not set ✗')"
node -e "console.log('DOCKER_ACCESS_TOKEN:', process.env.DOCKER_ACCESS_TOKEN ? 'Set ✓' : 'Not set ✗')"
node -e "console.log('DOCKER_USERNAME:', process.env.DOCKER_USERNAME ? 'Set ✓' : 'Not set ✗')"
node -e "console.log('DOCKER_REGISTRY:', process.env.DOCKER_REGISTRY ? 'Set ✓' : 'Not set ✗')"
node -e "console.log('DOCKER_HOST:', process.env.DOCKER_HOST ? 'Set ✓' : 'Not set ✗')"
node -e "console.log('SSH_DEV_CONTAINER_REPO:', process.env.SSH_DEV_CONTAINER_REPO ? 'Set ✓' : 'Not set ✗')"
node -e "console.log('OWNER:', process.env.OWNER ? 'Set ✓' : 'Not set ✗')"
```

## CI/CD Workflow Overview

Our CI/CD automation includes the following workflows:

1. **Agent Workflow**: Builds and tests the agent component
2. **Artifact Workflow**: Manages artifact uploads and downloads
3. **Build-Push DevContainer**: Builds and pushes the development container
4. **Dependency Update**: Manages dependencies
5. **Localized Dev Setup**: Sets up the development environment
6. **Scheduled Integration**: Runs integration tests on a schedule
7. **VS Code Insiders CI/Release**: CI/CD for VS Code Insiders extension

## Troubleshooting

If you encounter issues with the CI/CD workflows:

1. Verify all environment variables are correctly set
2. Check the workflow run logs in GitHub Actions
3. Validate Docker is running and accessible
4. Ensure your Personal Access Token has the necessary permissions
5. Check that the Docker registry credentials are valid