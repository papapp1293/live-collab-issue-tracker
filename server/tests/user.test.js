const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');

describe('User API tests', () => {
  beforeAll(async () => {
    await db.query('DELETE FROM users');
  });

  test('POST /api/test/create-user - create a user', async () => {
    const uniqueEmail = `testuser+${Date.now()}@example.com`;

    const userData = {
        email: uniqueEmail,
        name: 'Test User',
        role: 'developer',
    };

    const response = await request(app)
      .post('/api/test/create-user')
      .send(userData)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('email', userData.email);
    expect(response.body).toHaveProperty('name', userData.name);
    expect(response.body).toHaveProperty('role', userData.role);
  });

  afterAll(async () => {
    await db.query('DELETE FROM users');
    await db.pool.end(); // Properly close the DB pool
  });
});
