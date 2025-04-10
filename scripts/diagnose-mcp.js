#!/usr/bin/env node

/**
 * MCP System Diagnostic Script
 * 
 * This script checks the state of the Docker environment and MCP containers
 * to help diagnose startup issues.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// Expected MCP containers
const requiredContainers = [
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

// Required environment variables
const requiredEnvVars = [
  'REDIS_PASSWORD',
  'GITHUB_TOKEN',
  'PERSONAL_ACCESS_TOKEN',
  'DOCKER_USERNAME',
  'DOCKER_REGISTRY'
];

/**
 * Check if Docker is running and available
 */
function checkDocker() {
  console.log(`${colors.cyan}[1/6] Checking Docker installation...${colors.reset}`);
  try {
    const dockerVersion = execSync('docker --version').toString().trim();
    console.log(`${colors.green}✓ Docker is installed: ${dockerVersion}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Docker is not installed or not running!${colors.reset}`);
    console.error(`${colors.yellow}Please install Docker or start the Docker service.${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Check if Docker Compose is available
 */
function checkDockerCompose() {
  console.log(`${colors.cyan}[2/6] Checking Docker Compose...${colors.reset}`);
  try {
    const dockerComposeVersion = execSync('docker compose version || docker-compose --version').toString().trim();
    console.log(`${colors.green}✓ Docker Compose is installed: ${dockerComposeVersion}${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠ Docker Compose is not installed or not available in PATH.${colors.reset}`);
    console.log(`${colors.yellow}This may not be critical, but is recommended for easier container management.${colors.reset}`);
  }
}

/**
 * Check if environment variables are set correctly
 */
function checkEnvironmentVariables() {
  console.log(`${colors.cyan}[3/6] Checking environment variables...${colors.reset}`);
  
  // Check if .env file exists
  const envFilePath = path.join(__dirname, '..', '.env');
  const envFileExists = fs.existsSync(envFilePath);
  
  if (!envFileExists) {
    console.log(`${colors.yellow}⚠ .env file not found at ${envFilePath}${colors.reset}`);
    console.log(`${colors.yellow}Please create an .env file with the required variables.${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ .env file found${colors.reset}`);
  }
  
  // Check required environment variables
  const missingVars = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(`${colors.yellow}⚠ Missing environment variables: ${missingVars.join(', ')}${colors.reset}`);
    console.log(`${colors.yellow}Please set these variables in your .env file or in your system environment.${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ All required environment variables are set${colors.reset}`);
  }
}

/**
 * Check Docker network setup
 */
function checkDockerNetwork() {
  console.log(`${colors.cyan}[4/6] Checking Docker network setup...${colors.reset}`);
  try {
    const networks = execSync('docker network ls --format "{{.Name}}"').toString().trim().split('\n');
    
    if (networks.includes('mcp-network')) {
      console.log(`${colors.green}✓ mcp-network exists${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ mcp-network does not exist${colors.reset}`);
      console.log(`${colors.yellow}Creating mcp-network...${colors.reset}`);
      execSync('docker network create mcp-network');
      console.log(`${colors.green}✓ mcp-network created${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error checking Docker networks: ${error.message}${colors.reset}`);
  }
}

/**
 * Check Docker volumes
 */
function checkDockerVolumes() {
  console.log(`${colors.cyan}[5/6] Checking Docker volumes...${colors.reset}`);
  try {
    const volumes = execSync('docker volume ls --format "{{.Name}}"').toString().trim().split('\n');
    
    const requiredVolumes = ['mcp-redis-data', 'ollama-models'];
    const missingVolumes = [];
    
    for (const volume of requiredVolumes) {
      if (volumes.includes(volume)) {
        console.log(`${colors.green}✓ ${volume} exists${colors.reset}`);
      } else {
        missingVolumes.push(volume);
      }
    }
    
    if (missingVolumes.length > 0) {
      console.log(`${colors.yellow}⚠ Missing volumes: ${missingVolumes.join(', ')}${colors.reset}`);
      console.log(`${colors.yellow}Creating missing volumes...${colors.reset}`);
      
      for (const volume of missingVolumes) {
        execSync(`docker volume create ${volume}`);
        console.log(`${colors.green}✓ ${volume} created${colors.reset}`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error checking Docker volumes: ${error.message}${colors.reset}`);
  }
}

/**
 * Check MCP containers status
 */
function checkMcpContainers() {
  console.log(`${colors.cyan}[6/6] Checking MCP container status...${colors.reset}`);
  try {
    const containers = execSync('docker ps --format "{{.Names}}"').toString().trim().split('\n');
    const runningContainers = containers.filter(Boolean);  // Filter out empty strings
    
    const missingContainers = requiredContainers.filter(c => !runningContainers.includes(c));
    
    if (missingContainers.length === 0) {
      console.log(`${colors.green}✓ All MCP containers are running${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Some MCP containers are not running: ${missingContainers.join(', ')}${colors.reset}`);
      
      console.log(`${colors.cyan}Would you like to start the missing containers? (y/n)${colors.reset}`);
      process.stdout.write('> ');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.on('line', (input) => {
        if (input.toLowerCase() === 'y') {
          console.log(`${colors.cyan}Starting missing containers...${colors.reset}`);
          
          try {
            execSync('npx vscode-task mcp: start all', { stdio: 'inherit' });
            console.log(`${colors.green}✓ Containers started${colors.reset}`);
          } catch (error) {
            console.error(`${colors.red}✗ Error starting containers${colors.reset}`);
          }
        }
        
        rl.close();
      });
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error checking MCP containers: ${error.message}${colors.reset}`);
  }
}

/**
 * Main function to run all checks
 */
function main() {
  console.log(`${colors.magenta}=====================================${colors.reset}`);
  console.log(`${colors.magenta}=== MCP System Diagnostic Script ===${colors.reset}`);
  console.log(`${colors.magenta}=====================================${colors.reset}`);
  console.log();
  
  // Run all checks
  checkDocker();
  console.log();
  
  checkDockerCompose();
  console.log();
  
  checkEnvironmentVariables();
  console.log();
  
  checkDockerNetwork();
  console.log();
  
  checkDockerVolumes();
  console.log();
  
  checkMcpContainers();
  console.log();
  
  console.log(`${colors.magenta}=====================================${colors.reset}`);
  console.log(`${colors.magenta}======== Diagnostic Complete ========${colors.reset}`);
  console.log(`${colors.magenta}=====================================${colors.reset}`);
}

// Execute the main function
main();