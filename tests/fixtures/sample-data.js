/**
 * Sample test data fixtures
 * Reuse these fixtures across tests for consistency
 */

module.exports = {
    sampleUser: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    },
    
    sampleRepository: {
      id: 'repo-1',
      name: 'dev_container',
      owner: 'DeanLuus22021994',
      url: 'https://github.com/DeanLuus22021994/dev_container'
    },
    
    sampleMCPConfig: {
      gateway: 'http://localhost:8080',
      model: 'phi4-mini',
      enabled: true
    }
  };