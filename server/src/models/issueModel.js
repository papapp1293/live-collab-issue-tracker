// server/src/models/issueModel.js
const db = require('../utils/db');

const IssueModel = {
  // Create a new issue
  createIssue: async ({ title, description, assigned_developer = null, assigned_tester = null, ai_summary = null }) => {
    const result = await db.query(
      'INSERT INTO issues (title, description, assigned_developer, assigned_tester, ai_summary) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, assigned_developer, assigned_tester, ai_summary]
    );
    return result.rows[0];
  },

  // Get all issues
  getAllIssues: async () => {
    const result = await db.query(`
      SELECT i.*, 
             dev.name as assigned_developer_name,
             tester.name as assigned_tester_name
      FROM issues i 
      LEFT JOIN users dev ON i.assigned_developer = dev.id 
      LEFT JOIN users tester ON i.assigned_tester = tester.id 
      ORDER BY i.created_at DESC
    `);
    return result.rows;
  },

  // Get issues assigned to a specific user
  getIssuesByUserId: async (userId) => {
    const result = await db.query(`
      SELECT i.*, 
             dev.name as assigned_developer_name,
             tester.name as assigned_tester_name
      FROM issues i 
      LEFT JOIN users dev ON i.assigned_developer = dev.id 
      LEFT JOIN users tester ON i.assigned_tester = tester.id 
      WHERE i.assigned_developer = $1 OR i.assigned_tester = $1 
      ORDER BY i.created_at DESC
    `, [userId]);
    return result.rows;
  },

  // Get issue by ID
  getIssueById: async (id) => {
    const result = await db.query(`
      SELECT i.*, 
             dev.name as assigned_developer_name, dev.email as assigned_developer_email,
             tester.name as assigned_tester_name, tester.email as assigned_tester_email
      FROM issues i 
      LEFT JOIN users dev ON i.assigned_developer = dev.id 
      LEFT JOIN users tester ON i.assigned_tester = tester.id 
      WHERE i.id = $1
    `, [id]);
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

  // Get all issues for managers (includes unassigned ones)
  getIssuesForManager: async () => {
    const result = await db.query(`
      SELECT i.*, 
             dev.name as assigned_developer_name,
             tester.name as assigned_tester_name,
             CASE 
               WHEN i.assigned_developer IS NULL AND i.assigned_tester IS NULL THEN 'unassigned'
               WHEN i.assigned_developer IS NULL THEN 'needs_developer'
               WHEN i.assigned_tester IS NULL THEN 'needs_tester'
               ELSE 'fully_assigned'
             END as assignment_status
      FROM issues i 
      LEFT JOIN users dev ON i.assigned_developer = dev.id 
      LEFT JOIN users tester ON i.assigned_tester = tester.id 
      ORDER BY 
        CASE 
          WHEN i.assigned_developer IS NULL AND i.assigned_tester IS NULL THEN 0
          WHEN i.assigned_developer IS NULL OR i.assigned_tester IS NULL THEN 1
          ELSE 2
        END,
        i.created_at DESC
    `);
    return result.rows;
  },

  // Assign developer to issue
  assignDeveloper: async (issueId, developerId) => {
    const result = await db.query(
      'UPDATE issues SET assigned_developer = $1 WHERE id = $2 RETURNING *',
      [developerId, issueId]
    );
    return result.rows[0];
  },

  // Assign tester to issue
  assignTester: async (issueId, testerId) => {
    const result = await db.query(
      'UPDATE issues SET assigned_tester = $1 WHERE id = $2 RETURNING *',
      [testerId, issueId]
    );
    return result.rows[0];
  },

  // Update issue partially by ID (title, description, assigned_developer, assigned_tester, status)
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
