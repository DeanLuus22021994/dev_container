/**
 * Docker Cleanup Script
 * 
 * This script safely cleans up Docker resources while preserving essential MCP containers and images.
 * Use before running tests to ensure a clean environment.
 */

const { execSync } = require('child_process');
const readline = require('readline');

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
 * Prompt user for confirmation
 */
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Stop all running containers
 */
async function stopAllContainers() {
  console.log(`${colors.cyan}Stopping all running containers...${colors.reset}`);
  
  // Get list of running containers
  const containers = execute('docker ps -q', true);
  
  if (containers) {
    const containerCount = containers.split('\n').length;
    const shouldStop = await confirm(`${containerCount} running container(s) found. Stop them all?`);
    
    if (shouldStop) {
      execute('docker stop $(docker ps -q)');
      console.log(`${colors.green}All containers stopped.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Container stop operation cancelled.${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}No running containers found.${colors.reset}`);
  }
}

/**
 * Remove stopped containers
 */
async function removeStoppedContainers() {
  console.log(`${colors.cyan}Removing stopped containers...${colors.reset}`);
  
  // Get list of stopped containers
  const containers = execute('docker ps -a -q -f "status=exited"', true);
  
  if (containers) {
    const containerCount = containers.split('\n').length;
    const shouldRemove = await confirm(`${containerCount} stopped container(s) found. Remove them?`);
    
    if (shouldRemove) {
      execute('docker container prune -f');
      console.log(`${colors.green}Stopped containers removed.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Container removal operation cancelled.${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}No stopped containers found.${colors.reset}`);
  }
}

/**
 * Prune unused images but keep essential MCP images
 */
async function pruneUnusedImages() {
  console.log(`${colors.cyan}Pruning unused Docker images...${colors.reset}`);
  
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
    console.log(`${colors.yellow}Non-essential images found:${colors.reset}`);
    nonEssentialImages.forEach(image => console.log(`- ${image}`));
    
    const shouldPrune = await confirm(`Prune ${nonEssentialImages.length} non-essential images?`);
    
    if (shouldPrune) {
      // Remove non-essential images
      for (const image of nonEssentialImages) {
        try {
          execute(`docker rmi ${image}`, true);
          console.log(`${colors.green}Removed: ${image}${colors.reset}`);
        } catch (error) {
          console.log(`${colors.yellow}Failed to remove: ${image}${colors.reset}`);
        }
      }
      console.log(`${colors.green}Image pruning complete.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Image pruning cancelled.${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}No non-essential images found to prune.${colors.reset}`);
  }
  
  // Prune dangling images
  const shouldPruneDangling = await confirm('Prune dangling images? (untagged <none>:<none>)');
  if (shouldPruneDangling) {
    execute('docker image prune -f');
    console.log(`${colors.green}Dangling images pruned.${colors.reset}`);
  }
}

/**
 * Prune unused volumes
 */
async function pruneUnusedVolumes() {
  console.log(`${colors.cyan}Checking for unused Docker volumes...${colors.reset}`);
  
  // Define essential volumes to keep
  const essentialVolumes = ['mcp-redis-data', 'ollama-models'];
  
  // Get list of all volumes
  const volumes = execute('docker volume ls --format "{{.Name}}"', true).split('\n').filter(Boolean);
  const nonEssentialVolumes = volumes.filter(volume => !essentialVolumes.includes(volume));
  
  if (nonEssentialVolumes.length > 0) {
    console.log(`${colors.yellow}Non-essential volumes found:${colors.reset}`);
    nonEssentialVolumes.forEach(volume => console.log(`- ${volume}`));
    
    const shouldPrune = await confirm(`Prune ${nonEssentialVolumes.length} non-essential volumes?`);
    
    if (shouldPrune) {
      // Remove non-essential volumes
      for (const volume of nonEssentialVolumes) {
        try {
          execute(`docker volume rm ${volume}`, true);
          console.log(`${colors.green}Removed volume: ${volume}${colors.reset}`);
        } catch (error) {
          console.log(`${colors.yellow}Failed to remove volume: ${volume}${colors.reset}`);
        }
      }
    } else {
      console.log(`${colors.yellow}Volume pruning cancelled.${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}No non-essential volumes found to prune.${colors.reset}`);
  }
}

/**
 * Check MCP network
 */
function checkMcpNetwork() {
  console.log(`${colors.cyan}Checking MCP network...${colors.reset}`);
  
  const networks = execute('docker network ls --format "{{.Name}}"', true).split('\n');
  
  if (!networks.includes('mcp-network')) {
    console.log(`${colors.yellow}MCP network not found. Creating it...${colors.reset}`);
    execute('docker network create mcp-network');
    console.log(`${colors.green}MCP network created.${colors.reset}`);
  } else {
    console.log(`${colors.green}MCP network exists.${colors.reset}`);
  }
}

/**
 * Pull essential MCP images if needed
 */
async function pullEssentialImages() {
  console.log(`${colors.cyan}Checking essential MCP images...${colors.reset}`);
  
  const essentialImages = [
    'redis:7',
    'ghcr.io/modelcontextprotocol/gateway:latest',
    'ollama/ollama:latest'
  ];
  
  const shouldPull = await confirm('Pull essential MCP images?');
  
  if (shouldPull) {
    for (const image of essentialImages) {
      console.log(`${colors.blue}Pulling ${image}...${colors.reset}`);
      execute(`docker pull ${image}`);
    }
    console.log(`${colors.green}All essential images pulled.${colors.reset}`);
  }
}

/**
 * Display Docker resource usage
 */
function showDockerDiskUsage() {
  console.log(`${colors.cyan}Docker disk usage:${colors.reset}`);
  execute('docker system df');
}

/**
 * Main function to run the cleanup process
 */
async function main() {
  console.log(`${colors.magenta}=====================================${colors.reset}`);
  console.log(`${colors.magenta}==== MCP Docker Cleanup Script =====${colors.reset}`);
  console.log(`${colors.magenta}=====================================${colors.reset}`);
  console.log();
  
  showDockerDiskUsage();
  console.log();
  
  await stopAllContainers();
  console.log();
  
  await removeStoppedContainers();
  console.log();
  
  await pruneUnusedImages();
  console.log();
  
  await pruneUnusedVolumes();
  console.log();
  
  checkMcpNetwork();
  console.log();
  
  await pullEssentialImages();
  console.log();
  
  showDockerDiskUsage();
  console.log();
  
  console.log(`${colors.magenta}=====================================${colors.reset}`);
  console.log(`${colors.magenta}====== Cleanup Complete =============${colors.reset}`);
  console.log(`${colors.magenta}=====================================${colors.reset}`);
}

// Execute the main function
main().catch(error => {
  console.error(`${colors.red}An error occurred:${colors.reset}`, error);
  process.exit(1);
});