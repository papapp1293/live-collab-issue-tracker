const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');

describe('Issue API tests', () => {
  let testUserId;

  beforeAll(async () => {
    // Clean up and create a user to assign the issue to
    await db.query('DELETE FROM issues');
    await db.query('DELETE FROM users');

    const userRes = await db.query(
      `INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *`,
      ['testuser@example.com', 'Test User', 'developer']
    );
    testUserId = userRes.rows[0].id;
  });

  test('POST /api/test/create-issue - create an issue', async () => {
    const issueData = {
      title: 'Fix Bug',
      description: 'App crashes when clicking save',
      assigned_to: testUserId, // ✅ Use user ID, not email
    };

    const response = await request(app)
      .post('/api/test/create-issue')
      .send(issueData)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('title', issueData.title);
    expect(response.body).toHaveProperty('description', issueData.description);
    expect(response.body).toHaveProperty('assigned_to', issueData.assigned_to);
  });

  test('GET /api/test/issues - fetch all issues', async () => {
    const response = await request(app)
      .get('/api/test/issues')
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  afterAll(async () => {
    await db.query('DELETE FROM issues');
    await db.query('DELETE FROM users');
    await db.pool.end(); // properly close DB connection
  });
});
