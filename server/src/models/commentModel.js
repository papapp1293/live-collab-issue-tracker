// server/src/models/commentModel.js
const db = require('../utils/db');

const CommentModel = {
    // Create a new comment
    createComment: async ({ issue_id, user_id, content, parent_comment_id = null }) => {
        const result = await db.query(
            `INSERT INTO comments (issue_id, user_id, content, parent_comment_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [issue_id, user_id, content, parent_comment_id]
        );
        return result.rows[0];
    },

    // Get all comments for an issue with user information
    getCommentsByIssueId: async (issue_id) => {
        const result = await db.query(`
      SELECT c.*, 
             u.name as user_name, 
             u.email as user_email, 
             u.role as user_role,
             COUNT(replies.id) as reply_count
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN comments replies ON replies.parent_comment_id = c.id AND replies.is_deleted = FALSE
      WHERE c.issue_id = $1 AND c.is_deleted = FALSE
      GROUP BY c.id, u.name, u.email, u.role
      ORDER BY c.created_at ASC
    `, [issue_id]);
        return result.rows;
    },

    // Get replies to a specific comment
    getRepliesByCommentId: async (parent_comment_id) => {
        const result = await db.query(`
      SELECT c.*, 
             u.name as user_name, 
             u.email as user_email, 
             u.role as user_role
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE c.parent_comment_id = $1 AND c.is_deleted = FALSE
      ORDER BY c.created_at ASC
    `, [parent_comment_id]);
        return result.rows;
    },

    // Get comment by ID with user information
    getCommentById: async (id) => {
        const result = await db.query(`
      SELECT c.*, 
             u.name as user_name, 
             u.email as user_email, 
             u.role as user_role
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE c.id = $1 AND c.is_deleted = FALSE
    `, [id]);
        return result.rows[0];
    },

    // Update comment content
    updateComment: async (id, content, user_id) => {
        const result = await db.query(
            `UPDATE comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 AND is_deleted = FALSE 
       RETURNING *`,
            [content, id, user_id]
        );
        return result.rows[0];
    },

    // Soft delete a comment (only by the author or admin)
    deleteComment: async (id, user_id, user_role) => {
        // Allow deletion by comment author or managers
        let query, params;

        if (user_role === 'manager') {
            query = `UPDATE comments SET is_deleted = TRUE WHERE id = $1 RETURNING *`;
            params = [id];
        } else {
            query = `UPDATE comments SET is_deleted = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`;
            params = [id, user_id];
        }

        const result = await db.query(query, params);
        return result.rows[0];
    },

    // Get comments count for an issue
    getCommentsCount: async (issue_id) => {
        const result = await db.query(
            'SELECT COUNT(*) as count FROM comments WHERE issue_id = $1 AND is_deleted = FALSE',
            [issue_id]
        );
        return parseInt(result.rows[0].count);
    },

    // Get threaded comments structure (main comments with their replies)
    getThreadedComments: async (issue_id) => {
        // Get main comments (no parent)
        const mainComments = await db.query(`
      SELECT c.*, 
             u.name as user_name, 
             u.email as user_email, 
             u.role as user_role,
             COUNT(replies.id) as reply_count
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN comments replies ON replies.parent_comment_id = c.id AND replies.is_deleted = FALSE
      WHERE c.issue_id = $1 AND c.parent_comment_id IS NULL AND c.is_deleted = FALSE
      GROUP BY c.id, u.name, u.email, u.role
      ORDER BY c.created_at ASC
    `, [issue_id]);

        // Get all replies for these comments
        const comments = [];
        for (const comment of mainComments.rows) {
            const replies = await CommentModel.getRepliesByCommentId(comment.id);
            comments.push({
                ...comment,
                replies: replies || []
            });
        }

        return comments;
    }
};

module.exports = CommentModel;
