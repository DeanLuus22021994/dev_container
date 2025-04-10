/**
 * MCP System Test Suite for CI/CD automation
 * 
 * This implementation provides reliable orchestration of the MCP system 
 * components using Jest as a complete implementation with no VS Code dependencies.
 * 
 * All functionality previously handled by VS Code tasks is now managed here.
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);
const os = require('os');

// Node-fetch for Node.js < 18
let nodeFetch;
try {
  nodeFetch = require('node-fetch');
} catch (error) {
  // Not required if in Node.js >= 18
}

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
 * Fetch helper with proper Node.js compatibility
 */
async function fetchWithFallback(url, options = {}) {
  if (typeof fetch === 'function') {
    return fetch(url, options);
  } else if (nodeFetch) {
    return nodeFetch(url, options);
  } else {
    throw new Error('No fetch implementation available. Please install node-fetch or use Node.js >= 18');
  }
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
      'ollama/ollama:latest',
      'ghcr.io/modelcontextprotocol/gateway:latest',
      'ghcr.io/modelcontextprotocol/github-server:latest',
      'ghcr.io/modelcontextprotocol/vscode-server:latest',
      'ghcr.io/modelcontextprotocol/ollama-server:latest',
      'ghcr.io/modelcontextprotocol/code-interpreter:latest',
      'ghcr.io/modelcontextprotocol/git-history:latest',
      'ghcr.io/modelcontextprotocol/project-indexer:latest',
      'ghcr.io/modelcontextprotocol/dependency-analyzer:latest'
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

  test('Check GPU availability', async () => {
    try {
      const gpuResult = await execAsync('nvidia-smi');
      console.log('NVIDIA GPU detected');
      process.env.GPU_AVAILABLE = 'true';
    } catch (error) {
      console.log('NVIDIA GPU not detected or drivers not installed');
      process.env.GPU_AVAILABLE = 'false';
    }
    // This test always passes, it's just informational
    expect(true).toBeTruthy();
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
    
    if (process.env.GPU_AVAILABLE === 'true') {
      // Try with GPU support
      result = await dockerCmd('run -d --rm --name mcp-ollama --network mcp-network -p 11434:11434 --gpus all -v ollama-models:/root/.ollama -e OLLAMA_HOST=0.0.0.0 -e OLLAMA_MODELS=/root/.ollama ollama/ollama:latest');
    } else {
      // Fallback to no GPU
      result = await dockerCmd('run -d --rm --name mcp-ollama --network mcp-network -p 11434:11434 -v ollama-models:/root/.ollama -e OLLAMA_HOST=0.0.0.0 -e OLLAMA_MODELS=/root/.ollama ollama/ollama:latest');
    }
    
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-ollama');
    expect(isRunning).toBeTruthy();
    
    // Allow time for Ollama to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test('3. MCP Gateway starts successfully', async () => {
    // Get Redis password from env or use default
    const redisPassword = process.env.REDIS_PASSWORD || 'DeanLuus1994';
    
    const result = await dockerCmd(`run -d --rm --name mcp-gateway -p 8080:8080 --network mcp-network -e MCP_REDIS_URL=redis://mcp-redis:6379 -e MCP_REDIS_PASSWORD=${redisPassword} -e MCP_PORT=8080 -e LOG_LEVEL=info ghcr.io/modelcontextprotocol/gateway:latest`);
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-gateway');
    expect(isRunning).toBeTruthy();
    
    // Allow time for gateway to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
  
  test('4. GitHub server starts successfully', async () => {
    // Get GitHub token from env or warn if not available
    const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '';
    if (!githubToken) {
      console.warn('Warning: No GitHub token found in environment variables');
    }
    
    const result = await dockerCmd(`run -d --rm --name mcp-github --network mcp-network -e GITHUB_PERSONAL_ACCESS_TOKEN=${githubToken} -e MCP_GATEWAY_URL=http://mcp-gateway:8080 -e GITHUB_REPO_ID=963563992 -e GITHUB_REPO=DeanLuus22021994/dev_container ghcr.io/modelcontextprotocol/github-server:latest`);
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-github');
    expect(isRunning).toBeTruthy();
  });
  
  test('5. VS Code server starts successfully', async () => {
    const result = await dockerCmd('run -d --rm --name mcp-vscode --network mcp-network -e MCP_GATEWAY_URL=http://mcp-gateway:8080 -e VSCODE_EXTENSION_PATH=/workspace/extensions ghcr.io/modelcontextprotocol/vscode-server:latest');
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-vscode');
    expect(isRunning).toBeTruthy();
  });
  
  test('6. Ollama server starts successfully', async () => {
    const result = await dockerCmd('run -d --rm --name mcp-ollama-server --network mcp-network -e MCP_GATEWAY_URL=http://mcp-gateway:8080 -e OLLAMA_URL=http://mcp-ollama:11434 -e DEFAULT_MODEL=phi4-mini -e GPU_LAYERS=42 -e CTX_SIZE=2048 ghcr.io/modelcontextprotocol/ollama-server:latest');
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-ollama-server');
    expect(isRunning).toBeTruthy();
  });
  
  test('7. PHI4-mini model is available in Ollama', async () => {
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
  
  test('8. Code interpreter starts successfully', async () => {
    const workspacePath = process.cwd().replace(/\\/g, '/');
    const result = await dockerCmd(`run -d --rm --name mcp-code-interpreter --network mcp-network -v ${workspacePath}:/workspace -e MCP_GATEWAY_URL=http://mcp-gateway:8080 -e WORKSPACE_PATH=/workspace -e ALLOWED_LANGUAGES=python,javascript,typescript,bash,go,rust,c,cpp ghcr.io/modelcontextprotocol/code-interpreter:latest`);
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-code-interpreter');
    expect(isRunning).toBeTruthy();
  });
  
  test('9. Git history server starts successfully', async () => {
    const workspacePath = process.cwd().replace(/\\/g, '/');
    const result = await dockerCmd(`run -d --rm --name mcp-git-history --network mcp-network -v ${workspacePath}:/workspace -e MCP_GATEWAY_URL=http://mcp-gateway:8080 -e GIT_REPO_PATH=/workspace ghcr.io/modelcontextprotocol/git-history:latest`);
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-git-history');
    expect(isRunning).toBeTruthy();
  });
  
  test('10. Project indexer starts successfully', async () => {
    const workspacePath = process.cwd().replace(/\\/g, '/');
    const result = await dockerCmd(`run -d --rm --name mcp-indexer --network mcp-network -v ${workspacePath}:/workspace -e MCP_GATEWAY_URL=http://mcp-gateway:8080 -e WORKSPACE_PATH=/workspace -e INDEX_METHOD=vector ghcr.io/modelcontextprotocol/project-indexer:latest`);
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-indexer');
    expect(isRunning).toBeTruthy();
  });
  
  test('11. Dependency analyzer starts successfully', async () => {
    const workspacePath = process.cwd().replace(/\\/g, '/');
    const result = await dockerCmd(`run -d --rm --name mcp-dependencies --network mcp-network -v ${workspacePath}:/workspace -e MCP_GATEWAY_URL=http://mcp-gateway:8080 -e WORKSPACE_PATH=/workspace ghcr.io/modelcontextprotocol/dependency-analyzer:latest`);
    expect(result.success).toBeTruthy();
    
    const isRunning = await waitForContainer('mcp-dependencies');
    expect(isRunning).toBeTruthy();
  });
});

/**
 * Tests for validating MCP system functionality
 */
describe('MCP System Validation', () => {
  test('Ollama API is accessible', async () => {
    try {
      // Use direct HTTP request to check if Ollama API is responding
      const response = await fetchWithFallback('http://localhost:11434/api/version');
      const data = await response.text();
      expect(response.ok).toBeTruthy();
      console.log(`Ollama API response: ${data}`);
    } catch (error) {
      console.error('Ollama API check failed:', error.message);
      throw error;
    }
  });
  
  test('MCP Gateway API is accessible', async () => {
    try {
      const response = await fetchWithFallback('http://localhost:8080/health');
      const data = await response.text();
      expect(response.ok).toBeTruthy();
      console.log(`MCP Gateway API response: ${data}`);
    } catch (error) {
      console.error('MCP Gateway API check failed:', error.message);
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
  
  (shouldCleanup ? test : test.skip)('Remove Docker network and volumes', async () => {
    if (process.env.MCP_TEST_CLEANUP_NETWORK === 'true') {
      // Only run if explicitly requested to clean up network
      console.log('Removing Docker network...');
      await dockerCmd('network rm mcp-network');
      
      const networkStillExists = await networkExists('mcp-network');
      expect(networkStillExists).toBeFalsy();
    }
    
    if (process.env.MCP_TEST_CLEANUP_VOLUMES === 'true') {
      // Only run if explicitly requested to clean up volumes
      console.log('Removing Docker volumes...');
      await dockerCmd('volume rm mcp-redis-data ollama-models');
      
      const redisVolumeStillExists = await volumeExists('mcp-redis-data');
      const ollamaVolumeStillExists = await volumeExists('ollama-models');
      expect(redisVolumeStillExists || ollamaVolumeStillExists).toBeFalsy();
    }
  });
});