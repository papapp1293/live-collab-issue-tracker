const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');

describe('User Registration Flow', () => {
  let testEmail = `testuser+${Date.now()}@example.com`;

  test('POST /api/auth/register - create and verify user', async () => {
    const userData = {
      name: 'Test User',
      email: testEmail,
      password: 'test123',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .set('Accept', 'application/json');

    // Check response
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('email', userData.email);
    expect(response.body.user).toHaveProperty('name', userData.name);
    expect(response.body).toHaveProperty('token');

    // Check DB to ensure user is created
    const dbUser = await db.query('SELECT * FROM users WHERE email = $1', [testEmail]);
    expect(dbUser.rows.length).toBe(1);
    expect(dbUser.rows[0].email).toBe(testEmail);
  });

  afterAll(async () => {
    const deleteResult = await db.query('DELETE FROM users WHERE email = $1 RETURNING *', [testEmail]);

    // Verify that the user was deleted
    expect(deleteResult.rowCount).toBe(1);
    expect(deleteResult.rows[0].email).toBe(testEmail);

    await db.pool.end(); // Close DB connection
  });
});
