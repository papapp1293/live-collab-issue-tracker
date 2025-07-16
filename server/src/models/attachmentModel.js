// server/src/models/attachmentModel.js
const pool = require('../utils/db');

class AttachmentModel {
    static async create(attachmentData) {
        const { issue_id, comment_id, file_path, file_name, file_type } = attachmentData;

        const query = `
      INSERT INTO attachments (issue_id, comment_id, file_path, file_name, file_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

        const values = [issue_id, comment_id, file_path, file_name, file_type];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getByIssueId(issueId) {
        const query = `
      SELECT * FROM attachments 
      WHERE issue_id = $1 AND comment_id IS NULL
      ORDER BY created_at DESC;
    `;

        const result = await pool.query(query, [issueId]);
        return result.rows;
    }

    static async getByCommentId(commentId) {
        const query = `
      SELECT * FROM attachments 
      WHERE comment_id = $1
      ORDER BY created_at DESC;
    `;

        const result = await pool.query(query, [commentId]);
        return result.rows;
    }

    static async deleteById(id) {
        const query = 'DELETE FROM attachments WHERE id = $1 RETURNING *;';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = AttachmentModel;
