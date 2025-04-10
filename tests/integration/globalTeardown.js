/**
 * Global teardown for integration tests
 */
const { cleanupTests } = require('../helpers/setup-test-env');

module.exports = async () => {
  console.log('Cleaning up integration test environment...');
  await cleanupTests();
  console.log('Integration test cleanup complete');
};