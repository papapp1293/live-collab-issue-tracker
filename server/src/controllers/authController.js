const bcrypt = require('bcrypt');
const db = require('../utils/db');
const { generateToken, verifyToken } = require('../utils/jwt');  // import from your jwt.js

const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
            [name, email, hashed]
        );

        const user = result.rows[0];
        const token = generateToken({ id: user.id, email: user.email, role: user.role });  // include role in JWT
        res.json({ user, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const { password: _, ...userSafe } = user;
        const token = generateToken({ id: userSafe.id, email: userSafe.email, role: userSafe.role });  // include role in JWT
        res.json({ user: userSafe, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
};

module.exports = {
    register,
    login,
};
