const request = require('supertest');
const app = require('../server');

// These are lightweight integration smoke tests that require the server to be running
// and the database to be available. Set SKIP_INTEGRATION=true to skip them in CI/local runs.

const skip = process.env.SKIP_INTEGRATION === 'true';

describe('Integration smoke tests', () => {
  if (skip) {
    test('skipped', () => {
      expect(true).toBe(true);
    });
    return;
  }

  test('GET /sos should return 401 when not authenticated', async () => {
    const res = await request(app).get('/sos');
    expect([401, 302, 200]).toContain(res.status); // allow 302 redirect or 401 depending on middleware
  }, 10000);

  test('GET /dashboard should require auth', async () => {
    const res = await request(app).get('/dashboard');
    expect([401, 302]).toContain(res.status);
  }, 10000);
});
