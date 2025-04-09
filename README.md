# CI/CD Automated Project with Dev Container

This project demonstrates a fully automated CI/CD setup using GitHub Actions and development containers for consistent development environments.

## Features

- Development container for consistent development environment
- CI/CD automation using GitHub Actions
- Node.js Express sample application
- Automated testing with Jest
- Code quality with ESLint
- Docker containerization
- Continuous deployment workflow

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop)
- [Visual Studio Code](https://code.visualstudio.com/)
- [VS Code Remote Development Extension Pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)
- [Git](https://git-scm.com/downloads)

### Development Environment Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/your-username/cicd-automation.git
   cd cicd-automation
   ```

2. Open the project in VS Code:

   ```bash
   code .
   ```

3. When prompted, click "Reopen in Container" or use the command palette (F1) and select "Remote-Containers: Reopen in Container"

4. VS Code will build and start the dev container which includes all necessary dependencies.

## Development Workflow

1. Make your changes to the source code
2. Run tests locally:

   ```bash
   npm test
   ```

3. Check code quality:

   ```bash
   npm run lint
   ```

4. Commit and push your changes to GitHub
5. The CI/CD pipelines will automatically run:
   - CI pipeline tests and builds the application
   - CD pipeline deploys the application if all tests pass

## CI/CD Pipelines

### CI Pipeline (.github/workflows/ci.yml)

The Continuous Integration pipeline runs automatically on pull requests and pushes to the main branch:

1. Checks out the code
2. Sets up Node.js
3. Installs dependencies
4. Runs linting
5. Runs automated tests
6. Builds a Docker image
7. Saves the Docker image as an artifact

### CD Pipeline (.github/workflows/cd.yml)

The Continuous Deployment pipeline runs automatically after the CI pipeline successfully completes:

1. Downloads the Docker image artifact from the CI pipeline
2. Logs in to the container registry
3. Tags and pushes the Docker image
4. Deploys the application to the production environment

## Project Structure

```plaintext
.
├── .devcontainer/         # Development container configuration
│   ├── devcontainer.json  # Dev container settings
│   └── Dockerfile         # Dev container definition
├── .github/               # GitHub configuration
│   └── workflows/         # GitHub Actions workflows
│       ├── ci.yml         # CI pipeline
│       └── cd.yml         # CD pipeline
├── docs/                  # Documentation
├── src/                   # Source code
│   └── index.js           # Main application entry point
├── tests/                 # Test files
│   └── index.test.js      # Tests for the application
├── .eslintrc.json         # ESLint configuration
├── Dockerfile             # Production container definition
├── package.json           # Node.js dependencies and scripts
└── README.md              # This documentation file
```

## Customizing for Your Project

1. Update the package.json with your project details
2. Modify the src/index.js to implement your application logic
3. Update the Dockerfile if you need additional dependencies
4. Customize the CI/CD workflows in .github/workflows/
5. Configure your deployment target in the CD workflow
"# dev_container" 
