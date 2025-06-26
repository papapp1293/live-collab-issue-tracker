// server/src/models/issueModel.js
// Defines the schema and database interaction for issue records.

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
};

module.exports = IssueModel;
