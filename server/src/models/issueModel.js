// server/src/models/issueModel.js
const db = require('../utils/db');

const IssueModel = {
  // Create a new issue
  createIssue: async ({ title, description, assigned_to }) => {
    const result = await db.query(
      'INSERT INTO issues (title, description, assigned_to) VALUES ($1, $2, $3) RETURNING *',
      [title, description, assigned_to]
    );
    return result.rows[0];
  },

  // Get all issues
  getAllIssues: async () => {
    const result = await db.query('SELECT * FROM issues ORDER BY created_at DESC');
    return result.rows;
  },

  // Get issue by ID
  getIssueById: async (id) => {
    const result = await db.query('SELECT * FROM issues WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Update issue status
  updateIssueStatus: async (id, status) => {
    const result = await db.query(
      'UPDATE issues SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  // Update issue partially by ID (title, description, assigned_to, status)
  updateIssue: async (id, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) return null;

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const query = `UPDATE issues SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;

    const result = await db.query(query, [...values, id]);

    return result.rows[0] || null;
  },

  // Delete issue by ID
  deleteIssue: async (id) => {
    const result = await db.query('DELETE FROM issues WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

module.exports = IssueModel;
