// server/src/models/userModel.js
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

  // Get all users
  getAllUsers: async () => {
    const result = await db.query('SELECT * FROM users ORDER BY name');
    return result.rows;
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const result = await db.query('SELECT * FROM users WHERE role = $1 ORDER BY name', [role]);
    return result.rows;
  },

  // Update user by ID with partial data (email, name, role)
  updateUser: async (id, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) return null;

    // Build SET clause dynamically, parameter indexes start at $2 since $1 is id
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id, ...values]);
    return result.rows[0] || null;
  },

  // Delete user by ID
  deleteUser: async (id) => {
    const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

module.exports = UserModel;
