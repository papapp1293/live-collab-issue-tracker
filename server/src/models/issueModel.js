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

  // Advanced search and filtering
  searchIssues: async (filters = {}) => {
    try {
      let query = `
        SELECT i.*, 
               dev.name as assigned_developer_name,
               tester.name as assigned_tester_name
        FROM issues i 
        LEFT JOIN users dev ON i.assigned_developer = dev.id 
        LEFT JOIN users tester ON i.assigned_tester = tester.id 
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      // Text search in title and description
      if (filters.search && filters.search.trim()) {
        query += ` AND (LOWER(i.title) LIKE $${paramIndex} OR LOWER(i.description) LIKE $${paramIndex})`;
        params.push(`%${filters.search.toLowerCase()}%`);
        paramIndex++;
      }

      // Status filter
      if (filters.status) {
        query += ` AND i.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      // Developer assignment filter
      if (filters.assigned_developer) {
        query += ` AND i.assigned_developer = $${paramIndex}`;
        params.push(filters.assigned_developer);
        paramIndex++;
      }

      // Tester assignment filter
      if (filters.assigned_tester) {
        query += ` AND i.assigned_tester = $${paramIndex}`;
        params.push(filters.assigned_tester);
        paramIndex++;
      }

      // Date range filters
      if (filters.date_from) {
        query += ` AND i.created_at >= $${paramIndex}`;
        params.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        query += ` AND i.created_at <= $${paramIndex}`;
        params.push(filters.date_to + ' 23:59:59');
        paramIndex++;
      }

      // Assignment status filter
      if (filters.assignment_status) {
        switch (filters.assignment_status) {
          case 'unassigned':
            query += ' AND i.assigned_developer IS NULL AND i.assigned_tester IS NULL';
            break;
          case 'partially_assigned':
            query += ' AND (i.assigned_developer IS NULL OR i.assigned_tester IS NULL) AND NOT (i.assigned_developer IS NULL AND i.assigned_tester IS NULL)';
            break;
          case 'fully_assigned':
            query += ' AND i.assigned_developer IS NOT NULL AND i.assigned_tester IS NOT NULL';
            break;
        }
      }

      // AI summary filter
      if (filters.has_ai_summary) {
        if (filters.has_ai_summary === 'true') {
          query += ' AND i.ai_summary IS NOT NULL';
        } else if (filters.has_ai_summary === 'false') {
          query += ' AND i.ai_summary IS NULL';
        }
      }

      // Sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'DESC';
      query += ` ORDER BY i.${sortBy} ${sortOrder}`;

      // Pagination
      const limit = parseInt(filters.limit) || 50;
      const offset = parseInt(filters.offset) || 0;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('SearchIssues error:', error);
      throw error;
    }
  },
  // Get search results count for pagination
  getSearchResultsCount: async (filters = {}) => {
    try {
      let query = 'SELECT COUNT(*) as total FROM issues i WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      // Apply same filters as search (without joins for performance)
      if (filters.search && filters.search.trim()) {
        query += ` AND (LOWER(i.title) LIKE $${paramIndex} OR LOWER(i.description) LIKE $${paramIndex})`;
        params.push(`%${filters.search.toLowerCase()}%`);
        paramIndex++;
      }

      if (filters.status) {
        query += ` AND i.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.assigned_developer) {
        query += ` AND i.assigned_developer = $${paramIndex}`;
        params.push(filters.assigned_developer);
        paramIndex++;
      }

      if (filters.assigned_tester) {
        query += ` AND i.assigned_tester = $${paramIndex}`;
        params.push(filters.assigned_tester);
        paramIndex++;
      }

      if (filters.date_from) {
        query += ` AND i.created_at >= $${paramIndex}`;
        params.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        query += ` AND i.created_at <= $${paramIndex}`;
        params.push(filters.date_to + ' 23:59:59');
        paramIndex++;
      }

      if (filters.assignment_status) {
        switch (filters.assignment_status) {
          case 'unassigned':
            query += ' AND i.assigned_developer IS NULL AND i.assigned_tester IS NULL';
            break;
          case 'partially_assigned':
            query += ' AND (i.assigned_developer IS NULL OR i.assigned_tester IS NULL) AND NOT (i.assigned_developer IS NULL AND i.assigned_tester IS NULL)';
            break;
          case 'fully_assigned':
            query += ' AND i.assigned_developer IS NOT NULL AND i.assigned_tester IS NOT NULL';
            break;
        }
      }

      if (filters.has_ai_summary) {
        if (filters.has_ai_summary === 'true') {
          query += ' AND i.ai_summary IS NOT NULL';
        } else if (filters.has_ai_summary === 'false') {
          query += ' AND i.ai_summary IS NULL';
        }
      }

      const result = await db.query(query, params);
      const total = parseInt(result.rows[0].total);
      return total;
    } catch (error) {
      console.error('GetSearchResultsCount error:', error);
      throw error;
    }
  },
};

module.exports = IssueModel;
