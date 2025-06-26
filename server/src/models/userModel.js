// server/src/models/userModel.js
// Defines the schema and database interaction for user accounts.

const db = require('../utils/db');

const UserModel = {
  // Create a new user
  createUser: async ({ email, name, role = 'developer' }) => {
    const result = await db.query(
      'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *',
      [email, name, role]
    );
    return result.rows[0];
  },

  // Get user by email
  getUserByEmail: async (email) => {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  // Get user by ID
  getUserById: async (id) => {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },
};

module.exports = UserModel;
