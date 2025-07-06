// server/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const validToken = jwt.sign({ id: 1, email: 'test@example.com' }, process.env.JWT_SECRET, {
    expiresIn: '1h',
});
const invalidToken = 'Bearer invalid.token.here';

describe('Auth Middleware & Routes', () => {
    it('should allow access to public /api/auth/register without token', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Test User',
            email: `user${Date.now()}@example.com`,
            password: 'password123',
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('should reject access to protected /api/issues without token', async () => {
        const res = await request(app).get('/api/issues');
        expect(res.statusCode).toBe(401);
    });

    it('should reject access to protected /api/issues with invalid token', async () => {
        const res = await request(app)
            .get('/api/issues')
            .set('Authorization', invalidToken);
        expect(res.statusCode).toBe(401);
    });

    it('should allow access to /api/issues with valid token', async () => {
        const res = await request(app)
            .get('/api/issues')
            .set('Authorization', `Bearer ${validToken}`);

        // Expect 200 or 500 if DB isn't seeded, but not 401
        expect([200, 500]).toContain(res.statusCode);
    });
});
