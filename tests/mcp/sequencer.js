/**
 * Custom Jest test sequencer for MCP tests
 * 
 * This ensures that tests run in the correct order:
 * 1. Environment setup
 * 2. Container cleanup
 * 3. Container startup
 * 4. System validation
 * 5. System cleanup (when enabled)
 */

const Sequencer = require('@jest/test-sequencer').default;

// Define the desired test execution order
const TEST_ORDER = {
  'MCP Environment Setup': 1,
  'MCP Container Cleanup': 2,
  'MCP Container Startup': 3,
  'MCP System Validation': 4,
  'MCP System Cleanup': 5
};

class CustomSequencer extends Sequencer {
  /**
   * Sort test paths based on predefined order
   */
  sort(tests) {
    // First sort by file path (system-test.js should run first)
    const copyTests = Array.from(tests);
    
    return copyTests.sort((testA, testB) => {
      // Extract the describe block name from each test
      const testAName = this.getTestDescribeBlock(testA.path) || '';
      const testBName = this.getTestDescribeBlock(testB.path) || '';
      
      // Get the order for each test, defaulting to 999 if not found
      const orderA = TEST_ORDER[testAName] || 999;
      const orderB = TEST_ORDER[testBName] || 999;
      
      // Sort by the predefined order
      return orderA - orderB;
    });
  }
  
  /**
   * Extract the describe block name from a test file
   */
  getTestDescribeBlock(testPath) {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(testPath, 'utf8');
      const describeMatch = content.match(/describe\(['"](.+?)['"]/);
      
      if (describeMatch && describeMatch[1]) {
        return describeMatch[1];
      }
    } catch (error) {
      console.error(`Error reading test file ${testPath}: ${error.message}`);
    }
    
    return null;
  }
}

module.exports = CustomSequencer;