const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the CI/CD Automated Project!',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
  });
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    // Using info level which is allowed in the eslint config
    console.info(`Server running on port ${PORT}`);
  });
}

module.exports = app; // Export for testing
