// server/src/models/attachmentModel.js
const pool = require('../utils/db');

class AttachmentModel {
    static async create(attachmentData) {
        const { issue_id, comment_id, file_path, file_name, file_type, user_id } = attachmentData;

        // The constraint requires EITHER issue_id OR comment_id, but not both
        // If comment_id is provided, we set issue_id to NULL
        // If only issue_id is provided, we set comment_id to NULL
        let finalIssueId = null;
        let finalCommentId = null;

        if (comment_id) {
            // Attachment is for a comment, so issue_id must be NULL
            finalCommentId = comment_id;
            finalIssueId = null;
        } else if (issue_id) {
            // Attachment is for an issue, so comment_id must be NULL
            finalIssueId = issue_id;
            finalCommentId = null;
        } else {
            throw new Error('Either issue_id or comment_id must be provided');
        }

        const query = `
      INSERT INTO attachments (issue_id, comment_id, user_id, filename, file_path, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

        // Get file size from the file_path
        const fs = require('fs');
        let fileSize = 0;
        try {
            const stats = fs.statSync(file_path);
            fileSize = stats.size;
        } catch (error) {
            // Silently handle file size errors
        }

        const values = [
            finalIssueId,  // Either the issue_id or NULL
            finalCommentId, // Either the comment_id or NULL
            user_id || 1, // Default user_id if not provided
            file_name,    // maps to 'filename' column
            file_path,
            fileSize,     // calculated file size
            file_type     // maps to 'mime_type' column
        ];

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
