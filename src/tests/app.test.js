const request = require('supertest');
const app = require('../app');

describe('Ticko API basic flow', () => {
  it('health endpoint works', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

