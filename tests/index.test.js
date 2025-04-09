const request = require('supertest');
const app = require('../src/index');

describe('Express App Endpoints', () => {
  test('GET / should return welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('Welcome to the CI/CD Automated Project!');
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('running');
  });

  test('GET /health should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });
});
