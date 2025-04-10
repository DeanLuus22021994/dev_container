/**
 * MCP System Test Suite for CI/CD automation
 * 
 * This implementation provides reliable orchestration of the MCP system 
 * components using Jest as a complete implementation with no mocks.
 * 
 * Windows compatibility is ensured throughout, with proper command syntax.
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);
const os = require('os');

// Configure longer timeouts for container operations
jest.setTimeout(180000); // 3 minutes

// Windows-specific command modifications
const isWindows = os.platform() === 'windows' || process.platform === 'win32';

/**
 * Execute a Docker command with Windows compatibility
 * @param {string} command - Docker command to execute
 * @param {boolean} silent - Whether to suppress output
 * @returns {Promise<{success: boolean, stdout: string, stderr: string}>}
 */
async function dockerCmd(command, silent = false) {
  try {
    // Use appropriate command execution based on OS
    const cmdOptions = silent ? { stdio: 'pipe' } : {};
    const fullCommand = `docker ${command}`;
    
    console.log(`Executing: ${fullCommand}`);
    const { stdout, stderr } = await execAsync(fullCommand, cmdOptions);
    return { success: true, stdout, stderr };
  } catch (error) {
    if (!silent) {
      console.error(`Command failed: docker ${command}`);
      console.error(error.message);
      if (error.stdout) console.error(`stdout: ${error.stdout}`);
      if (error.stderr) console.error(`stderr: ${error.stderr}`);
    }
    return { 
      success: false, 
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      error: error.message
    };
  }
}

/**
 * Get list of running containers
 */
async function getRunningContainers() {
  const result = await dockerCmd('ps --format "{{.Names}}"', true);
  return result.success ? result.stdout.split('\n').filter(Boolean) : [];
}

/**
 * Stop a container if it's running
 */
async function stopContainerIfRunning(containerName) {
  const containers = await getRunningContainers();
  if (containers.includes(containerName)) {
    console.log(`Stopping container: ${containerName}`);
    await dockerCmd(`stop ${containerName}`);
    return true;
  }
  return false;
}

/**
 * Check if network exists
 */
async function networkExists(networkName) {
  const result = await dockerCmd('network ls --format "{{.Name}}"', true);
  return result.success && result.stdout.split('\n').includes(networkName);
}

/**
 * Check if volume exists
 */
async function volumeExists(volumeName) {
  const result = await dockerCmd('volume ls --format "{{.Name}}"', true);
  return result.success && result.stdout.split('\n').includes(volumeName);
}

/**
 * Tests for Docker environment setup
 */
describe('MCP Environment Setup', () => {
  test('Docker is running', async () => {
    const result = await dockerCmd('info', true);
    expect(result.success).toBeTruthy();
  });

  test('Docker network exists or can be created', async () => {
    const hasNetwork = await networkExists('mcp-network');
    
    if (!hasNetwork) {
      console.log('Creating mcp-network...');
      const result = await dockerCmd('network create mcp-network');
      expect(result.success).toBeTruthy();
    } else {
      console.log('mcp-network already exists');
      expect(hasNetwork).toBeTruthy();
    }
  });

  test('Required Docker volumes exist or can be created', async () => {
    const volumes = ['mcp-redis-data', 'ollama-models'];
    
    for (const volume of volumes) {
      const hasVolume = await volumeExists(volume);
      
      if (!hasVolume) {
        console.log(`Creating volume: ${volume}`);
        const result = await dockerCmd(`volume create ${volume}`);
        expect(result.success).toBeTruthy();
      } else {
        console.log(`Volume ${volume} already exists`);
        expect(hasVolume).toBeTruthy();
      }
    }
  });
  
  test('Required Docker images are available', async () => {
    const requiredImages = [
      'redis:7',
      'ollama/ollama:latest'
    ];
    
    for (const image of requiredImages) {
      console.log(`Checking for image: ${image}`);
      const imageCheck = await dockerCmd(`images --format "{{.Repository}}:{{.Tag}}" ${image}`, true);
      
      if (!imageCheck.success || !imageCheck.stdout.trim()) {
        console.log(`Pulling image: ${image}`);
        const pullResult = await dockerCmd(`pull ${image}`);
        expect(pullResult.success).toBeTruthy();
      } else {
        console.log(`Image ${image} already exists`);
        expect(imageCheck.success).toBeTruthy();
      }
    }
  });
});

/**
 * Tests for stopping existing containers
 */
describe('MCP Container Cleanup', () => {
  test('Stop any existing MCP containers', async () => {
    const mcpContainers = [
      'mcp-redis',
      'mcp-gateway',
      'mcp-github',
      'mcp-vscode',
      'mcp-ollama',
      'mcp-ollama-server',
      'mcp-code-interpreter',
      'mcp-git-history',
      'mcp-indexer',
      'mcp-dependencies'
    ];
    
    for (const container of mcpContainers) {
      await stopContainerIfRunning(container);
    }
    
    // Check that none of the MCP containers are running
    const runningContainers = await getRunningContainers();
    const stillRunningMcpContainers = mcpContainers.filter(c => runningContainers.includes(c));
    
    if (stillRunningMcpContainers.length > 0) {
      console.warn(`Warning: These MCP containers are still running: ${stillRunningMcpContainers.join(', ')}`);
    }
    
    expect(stillRunningMcpContainers.length).toBe(0);
  });
});

/**
 * Tests for starting containers in sequence
 */
describe('MCP Container Startup', () => {
  /**
   * Helper function to check if container is running and healthy
   */
  async function waitForContainer(name, maxRetries = 10, delay = 3000) {
    for (let i = 0; i < maxRetries; i++) {
      const containers = await getRunningContainers();
      if (containers.includes(name)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
  }
  
  test('1. Redis starts successfully', async () => {
    const result = await dockerCmd('run -d --rm --name mcp-redis -p 6379:6379 --network mcp-network -v mcp-redis-data:/data redis:7');
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-redis');
    expect(isRunning).toBeTruthy();
  });

  test('2. Ollama starts successfully', async () => {
    let result;
    
    try {
      // First try with GPU support
      result = await dockerCmd('run -d --rm --name mcp-ollama --network mcp-network -p 11434:11434 --gpus all -v ollama-models:/root/.ollama -e OLLAMA_HOST=0.0.0.0 -e OLLAMA_MODELS=/root/.ollama ollama/ollama:latest');
    } catch (error) {
      console.log('GPU support failed, retrying without GPU...');
      // Fallback to no GPU
      result = await dockerCmd('run -d --rm --name mcp-ollama --network mcp-network -p 11434:11434 -v ollama-models:/root/.ollama -e OLLAMA_HOST=0.0.0.0 -e OLLAMA_MODELS=/root/.ollama ollama/ollama:latest');
    }
    
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-ollama');
    expect(isRunning).toBeTruthy();
    
    // Allow time for Ollama to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
  
  test('3. PHI4-mini model is available in Ollama', async () => {
    // Check if the model is already available
    const modelCheck = await dockerCmd('exec mcp-ollama ollama list', true);
    
    if (!modelCheck.success || !modelCheck.stdout.includes('phi4-mini')) {
      console.log('PHI4-mini model not found, pulling...');
      const pullResult = await dockerCmd('exec mcp-ollama ollama pull phi4-mini');
      expect(pullResult.success).toBeTruthy();
    } else {
      console.log('PHI4-mini model already available');
      expect(modelCheck.success).toBeTruthy();
    }
  });
  
  // Additional containers can be started using VS Code tasks for better management
  test('VS Code tasks are available for starting other components', () => {
    const tasksFilePath = path.join(__dirname, '../../.vscode/tasks.json');
    expect(fs.existsSync(tasksFilePath)).toBeTruthy();
    
    const tasksContent = fs.readFileSync(tasksFilePath, 'utf8');
    const tasks = JSON.parse(tasksContent);
    
    const requiredTasks = [
      'mcp: start gateway',
      'mcp: start github',
      'mcp: start vscode',
      'mcp: start ollama-server',
      'mcp: start code-interpreter',
      'mcp: start git-history',
      'mcp: start project-indexer',
      'mcp: start dependency-analyzer'
    ];
    
    const taskLabels = tasks.tasks.map(t => t.label);
    const missingTasks = requiredTasks.filter(rt => !taskLabels.includes(rt));
    
    if (missingTasks.length > 0) {
      console.warn(`Warning: Missing tasks: ${missingTasks.join(', ')}`);
    }
    
    expect(missingTasks.length).toBe(0);
  });
});

/**
 * Tests for validating MCP system functionality
 */
describe('MCP System Validation', () => {
  test('Ollama API is accessible', async () => {
    try {
      // Use direct HTTP request to check if Ollama API is responding
      const response = await fetch('http://localhost:11434/api/version');
      const data = await response.text();
      expect(response.ok).toBeTruthy();
      console.log(`Ollama API response: ${data}`);
    } catch (error) {
      console.error('Ollama API check failed:', error.message);
      throw error;
    }
  });
});

/**
 * Optional cleanup tests (controlled by environment variable)
 */
describe('MCP System Cleanup', () => {
  const shouldCleanup = process.env.MCP_TEST_CLEANUP === 'true';
  
  (shouldCleanup ? test : test.skip)('Stop all MCP containers', async () => {
    const mcpContainers = [
      'mcp-redis',
      'mcp-ollama',
      'mcp-gateway',
      'mcp-github',
      'mcp-vscode',
      'mcp-ollama-server',
      'mcp-code-interpreter',
      'mcp-git-history',
      'mcp-indexer',
      'mcp-dependencies'
    ];
    
    for (const container of mcpContainers) {
      await stopContainerIfRunning(container);
    }
    
    // Verify containers were stopped
    const runningContainers = await getRunningContainers();
    const stillRunningMcpContainers = mcpContainers.filter(c => runningContainers.includes(c));
    expect(stillRunningMcpContainers.length).toBe(0);
  });
});