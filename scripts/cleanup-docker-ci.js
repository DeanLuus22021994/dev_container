#!/usr/bin/env node

/**
 * Non-interactive Docker Cleanup Script for CI/CD environments
 * 
 * This script automatically cleans up Docker resources for testing without user prompts.
 * It focuses on preserving essential MCP containers and images while removing everything else.
 */

const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Execute a command and return the output
 */
function execute(command, silent = false) {
  try {
    const options = silent ? { stdio: 'pipe' } : { stdio: 'inherit' };
    return execSync(command, options).toString().trim();
  } catch (error) {
    if (!silent) {
      console.error(`${colors.red}Command failed: ${command}${colors.reset}`);
      if (error.stdout) console.error(`${error.stdout.toString()}`);
      if (error.stderr) console.error(`${error.stderr.toString()}`);
    }
    return '';
  }
}

/**
 * Log a message with timestamp
 */
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

/**
 * Check if MCP containers are running
 */
function checkMcpContainers() {
  log('Checking for running MCP containers...', colors.cyan);
  
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
  
  const running = [];
  
  for (const container of mcpContainers) {
    const result = execute(`docker ps -q -f "name=${container}"`, true);
    if (result) {
      running.push(container);
    }
  }
  
  return running;
}

/**
 * Stop all running containers
 */
function stopAllContainers() {
  log('Stopping all running containers...', colors.cyan);
  
  // Get list of running containers
  const containers = execute('docker ps -q', true);
  
  if (containers) {
    const containerCount = containers.split('\n').length;
    log(`Found ${containerCount} running container(s). Stopping...`, colors.yellow);
    
    execute('docker stop $(docker ps -q)');
    log('All containers stopped.', colors.green);
  } else {
    log('No running containers found.', colors.yellow);
  }
}

/**
 * Remove stopped containers
 */
function removeStoppedContainers() {
  log('Removing stopped containers...', colors.cyan);
  
  // Get list of stopped containers
  const containers = execute('docker ps -a -q -f "status=exited"', true);
  
  if (containers) {
    const containerCount = containers.split('\n').length;
    log(`Found ${containerCount} stopped container(s). Removing...`, colors.yellow);
    
    execute('docker container prune -f');
    log('Stopped containers removed.', colors.green);
  } else {
    log('No stopped containers found.', colors.yellow);
  }
}

/**
 * Prune unused images but keep essential MCP images
 */
function pruneUnusedImages() {
  log('Pruning unused Docker images...', colors.cyan);
  
  // Define essential images to keep (partial matches)
  const essentialImages = [
    'redis:7',
    'ghcr.io/modelcontextprotocol',
    'ollama/ollama'
  ];
  
  // Get list of all images
  const images = execute('docker images --format "{{.Repository}}:{{.Tag}}"', true).split('\n');
  const nonEssentialImages = images.filter(image => 
    !essentialImages.some(essential => image.includes(essential)) && 
    image !== '<none>:<none>' && 
    image !== ''
  );
  
  if (nonEssentialImages.length > 0) {
    log(`Found ${nonEssentialImages.length} non-essential images. Removing...`, colors.yellow);
    
    // Remove non-essential images
    for (const image of nonEssentialImages) {
      try {
        execute(`docker rmi ${image}`, true);
        log(`Removed: ${image}`, colors.green);
      } catch (error) {
        log(`Failed to remove: ${image}`, colors.yellow);
      }
    }
    log('Image pruning complete.', colors.green);
  } else {
    log('No non-essential images found to prune.', colors.yellow);
  }
  
  // Prune dangling images
  log('Pruning dangling images...', colors.cyan);
  execute('docker image prune -f');
  log('Dangling images pruned.', colors.green);
}

/**
 * Prune unused volumes except essential ones
 */
function pruneUnusedVolumes() {
  log('Checking for unused Docker volumes...', colors.cyan);
  
  // Define essential volumes to keep
  const essentialVolumes = ['mcp-redis-data', 'ollama-models'];
  
  // Get list of all volumes
  const volumes = execute('docker volume ls --format "{{.Name}}"', true).split('\n').filter(Boolean);
  const nonEssentialVolumes = volumes.filter(volume => !essentialVolumes.includes(volume));
  
  if (nonEssentialVolumes.length > 0) {
    log(`Found ${nonEssentialVolumes.length} non-essential volumes. Removing...`, colors.yellow);
    
    // Remove non-essential volumes
    for (const volume of nonEssentialVolumes) {
      try {
        execute(`docker volume rm ${volume}`, true);
        log(`Removed volume: ${volume}`, colors.green);
      } catch (error) {
        log(`Failed to remove volume: ${volume}`, colors.yellow);
      }
    }
  } else {
    log('No non-essential volumes found to prune.', colors.yellow);
  }
}

/**
 * Create MCP network if it doesn't exist
 */
function ensureMcpNetwork() {
  log('Checking MCP network...', colors.cyan);
  
  const networks = execute('docker network ls --format "{{.Name}}"', true).split('\n');
  
  if (!networks.includes('mcp-network')) {
    log('MCP network not found. Creating it...', colors.yellow);
    execute('docker network create mcp-network');
    log('MCP network created.', colors.green);
  } else {
    log('MCP network exists.', colors.green);
  }
}

/**
 * Create essential volumes if they don't exist
 */
function ensureEssentialVolumes() {
  log('Checking essential volumes...', colors.cyan);
  
  const essentialVolumes = ['mcp-redis-data', 'ollama-models'];
  const volumes = execute('docker volume ls --format "{{.Name}}"', true).split('\n');
  
  for (const volume of essentialVolumes) {
    if (!volumes.includes(volume)) {
      log(`Creating essential volume: ${volume}...`, colors.yellow);
      execute(`docker volume create ${volume}`);
      log(`Volume ${volume} created.`, colors.green);
    } else {
      log(`Essential volume ${volume} exists.`, colors.green);
    }
  }
}

/**
 * Pull essential MCP images
 */
function pullEssentialImages() {
  log('Pulling essential MCP images...', colors.cyan);
  
  const essentialImages = [
    'redis:7',
    'ghcr.io/modelcontextprotocol/gateway:latest',
    'ollama/ollama:latest'
  ];
  
  for (const image of essentialImages) {
    log(`Pulling ${image}...`, colors.blue);
    execute(`docker pull ${image}`);
  }
  log('All essential images pulled.', colors.green);
}

/**
 * Display Docker resource usage
 */
function showDockerDiskUsage() {
  log('Docker disk usage:', colors.cyan);
  execute('docker system df');
}

/**
 * Main function to run the cleanup process
 */
function main() {
  log('====================================', colors.magenta);
  log('=== MCP Docker CI Cleanup Script ===', colors.magenta);
  log('====================================', colors.magenta);
  log('');
  
  // Get current state
  const runningMcpContainers = checkMcpContainers();
  if (runningMcpContainers.length > 0) {
    log(`Found running MCP containers: ${runningMcpContainers.join(', ')}`, colors.yellow);
  }
  
  // Show initial Docker usage
  showDockerDiskUsage();
  log('');
  
  // Stop all containers
  stopAllContainers();
  log('');
  
  // Remove stopped containers
  removeStoppedContainers();
  log('');
  
  // Prune unused images (keeping essential ones)
  pruneUnusedImages();
  log('');
  
  // Prune unused volumes (keeping essential ones)
  pruneUnusedVolumes();
  log('');
  
  // Ensure MCP network exists
  ensureMcpNetwork();
  log('');
  
  // Ensure essential volumes exist
  ensureEssentialVolumes();
  log('');
  
  // Pull essential images
  pullEssentialImages();
  log('');
  
  // Show final Docker usage
  showDockerDiskUsage();
  log('');
  
  log('====================================', colors.magenta);
  log('====== Cleanup Complete ===========', colors.magenta);
  log('====================================', colors.magenta);
}

// Execute the main function
try {
  main();
} catch (error) {
  log(`An error occurred: ${error.message}`, colors.red);
  process.exit(1);
}