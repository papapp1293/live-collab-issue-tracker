// server/src/models/issueModel.js
const db = require('../utils/db');

const IssueModel = {
  // Create a new issue
  createIssue: async ({ title, description, assigned_to, ai_summary = null }) => {
    const result = await db.query(
      'INSERT INTO issues (title, description, assigned_to, ai_summary) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, assigned_to, ai_summary]
    );
    return result.rows[0];
  },

  // Get all issues
  getAllIssues: async () => {
    const result = await db.query(`
      SELECT i.*, u.name as assigned_to_name 
      FROM issues i 
      LEFT JOIN users u ON i.assigned_to = u.id 
      ORDER BY i.created_at DESC
    `);
    return result.rows;
  },

  // Get issues assigned to a specific user
  getIssuesByUserId: async (userId) => {
    const result = await db.query(
      'SELECT i.*, u.name as assigned_to_name FROM issues i LEFT JOIN users u ON i.assigned_to = u.id WHERE i.assigned_to = $1 ORDER BY i.created_at DESC',
      [userId]
    );
    return result.rows;
  },

  // Get issue by ID
  getIssueById: async (id) => {
    const result = await db.query(
      'SELECT i.*, u.name as assigned_to_name, u.email as assigned_to_email FROM issues i LEFT JOIN users u ON i.assigned_to = u.id WHERE i.id = $1',
      [id]
    );
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

  // Update AI summary for an issue
  updateAISummary: async (id, aiSummary) => {
    const result = await db.query(
      'UPDATE issues SET ai_summary = $1 WHERE id = $2 RETURNING *',
      [aiSummary, id]
    );
    return result.rows[0];
  },

  // Delete issue by ID
  deleteIssue: async (id) => {
    const result = await db.query('DELETE FROM issues WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

module.exports = IssueModel;
