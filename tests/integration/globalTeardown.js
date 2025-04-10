/**
 * Global teardown for integration tests
 * Cleans up resources after devcontainer automation testing
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// eslint-disable-next-line no-console
module.exports = async () => {
  console.log('🧹 Cleaning up integration test environment...');

  // Clean up test containers if we're using actual containers
  if (process.env.USE_ACTUAL_CONTAINERS === 'true') {
    try {
      // Find and remove test containers (those with "test-" prefix)
      // eslint-disable-next-line no-console
      console.log('Removing test containers...');
      const containersCmd = "docker ps -a --filter 'name=test-' --format '{{.Names}}'";
      const containers = execSync(containersCmd).toString().trim();

      if (containers) {
        containers.split('\n').forEach(container => {
          if (container) {
            // eslint-disable-next-line no-console
            console.log(`Removing container: ${container}`);
            execSync(`docker rm -f ${container}`, { stdio: 'inherit' });
          }
        });
        // eslint-disable-next-line no-console
        console.log('✓ Test containers removed');
      } else {
        // eslint-disable-next-line no-console
        console.log('✓ No test containers to remove');
      }

      // Clean up test images (optional - be careful with this in shared environments)
      if (process.env.CLEANUP_TEST_IMAGES === 'true') {
        // eslint-disable-next-line no-console
        console.log('Removing test images...');
        const imagesCmd =
          "docker images --filter 'reference=*test*' --format '{{.Repository}}:{{.Tag}}'";
        const images = execSync(imagesCmd).toString().trim();

        if (images) {
          images.split('\n').forEach(image => {
            if (image && !image.includes('<none>')) {
              // eslint-disable-next-line no-console
              console.log(`Removing image: ${image}`);
              execSync(`docker rmi -f ${image}`, { stdio: 'inherit' });
            }
          });
          // eslint-disable-next-line no-console
          console.log('✓ Test images removed');
        } else {
          // eslint-disable-next-line no-console
          console.log('✓ No test images to remove');
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('⚠️ Error cleaning up Docker resources:', error.message);
    }
  }

  // Clean up temp files
  try {
    const tempDir = global.__TEMP_DIR__ || path.join(__dirname, '../../temp');
    if (fs.existsSync(tempDir)) {
      // Only remove files, not the directory itself
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        if (!fs.statSync(filePath).isDirectory()) {
          fs.unlinkSync(filePath);
        }
      });
      // eslint-disable-next-line no-console
      console.log('✓ Temporary files cleaned up');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('⚠️ Error cleaning up temp files:', error.message);
  }

  // eslint-disable-next-line no-console
  console.log('✓ Integration test environment cleanup complete');
};
