const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Issue API tests', () => {
  let token;
  let createdIssueId;
  let testUserId;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    const userRes = await db.query(
      `INSERT INTO users (email, name, role, password) VALUES ($1, $2, $3, $4) RETURNING *`,
      [uniqueEmail, 'Test User', 'developer', hashedPassword]
    );
    testUserId = userRes.rows[0].id;

    // Generate JWT token
    token = jwt.sign(
      { id: testUserId, email: userRes.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  test('POST /api/issues - create an issue', async () => {
    const issueData = {
      title: 'Test Issue',
      description: 'This is a test issue.',
      assigned_to: testUserId,
    };

    const response = await request(app)
      .post('/api/issues')
      .send(issueData)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(201); //Succesfully created
    expect(response.body).toHaveProperty('title', issueData.title);
    expect(response.body).toHaveProperty('description', issueData.description);
    expect(response.body).toHaveProperty('assigned_to', issueData.assigned_to);

    createdIssueId = response.body.id; //Store it for deletion later
  });

  test('GET /api/issues - fetch all issues', async () => {
    const response = await request(app)
      .get('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200); //Successfully retrieved
    expect(Array.isArray(response.body)).toBe(true);
  });

  afterAll(async () => {
    // Cleanup: delete created issue and user
    if (createdIssueId) {
      await db.query('DELETE FROM issues WHERE id = $1', [createdIssueId]);
    }
    if (testUserId) {
      await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }

    await db.pool.end(); // Properly close DB connection
  });
});
