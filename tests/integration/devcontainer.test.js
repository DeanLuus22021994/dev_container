/**
 * Integration test for devcontainer automation
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Helper function to run commands
const runCommand = cmd => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    console.error(error.stdout?.toString() || '');
    console.error(error.stderr?.toString() || '');
    throw error;
  }
};

describe('Devcontainer Environment', () => {
  // Skip tests if not using actual containers
  const skipIfMocked = process.env.USE_ACTUAL_CONTAINERS !== 'true' ? test.skip : test;

  // Basic test that always runs
  test('Environment variables are properly set', () => {
    expect(process.env.DOCKER_USERNAME).toBeDefined();
    expect(process.env.DOCKER_REGISTRY).toBeDefined();
  });

  // Test Docker functionality
  skipIfMocked('Docker is available and working', () => {
    const result = runCommand('docker --version');
    expect(result).toMatch(/Docker version/);

    // Test docker run
    const containerName = `test-container-${Date.now()}`;
    const output = runCommand(`docker run --name ${containerName} -d --rm hello-world`);
    expect(output).toBeTruthy();

    // Cleanup
    runCommand(`docker rm -f ${containerName} || true`);
  });

  // Test for specific devcontainer scenarios
  skipIfMocked('Can build a simple devcontainer', () => {
    // Create a temp directory with a simple Dockerfile
    const testDir = path.join(global.__TEMP_DIR__, 'test-devcontainer');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create a simple Dockerfile
    const dockerfilePath = path.join(testDir, 'Dockerfile');
    fs.writeFileSync(
      dockerfilePath,
      `
FROM node:16-alpine
WORKDIR /app
COPY . .
CMD ["node", "--version"]
    `
    );

    // Build the container
    const imageName = `test-devcontainer-${Date.now()}`;
    const buildResult = runCommand(`docker build -t ${imageName} ${testDir}`);
    expect(buildResult).toBeTruthy();

    // Run the container
    const runResult = runCommand(`docker run --rm ${imageName}`);
    expect(runResult).toMatch(/v16/);

    // Cleanup
    runCommand(`docker rmi ${imageName} || true`);
  });
});

// Optional: Only if you have GitHub CLI integration
describe('GitHub Integration', () => {
  // Skip these tests if GITHUB_TOKEN isn't available
  const skipIfNoGithub = !process.env.PERSONAL_ACCESS_TOKEN ? describe.skip : describe;

  skipIfNoGithub('GitHub API', () => {
    // Mock test that doesn't actually call GitHub
    test('GitHub environment is configured', () => {
      expect(process.env.PERSONAL_ACCESS_TOKEN).toBeDefined();
      expect(process.env.OWNER).toBeDefined();
      expect(process.env.SSH_DEV_CONTAINER_REPO).toBeDefined();
    });
  });
});
