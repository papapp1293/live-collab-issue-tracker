// server/src/routes/commentRoutes.js
const express = require('express');
const CommentModel = require('../models/commentModel');
const router = express.Router();

// Get all comments for an issue (threaded)
router.get('/issue/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const comments = await CommentModel.getThreadedComments(issueId);
        res.json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Create a new comment
router.post('/', async (req, res) => {
    try {
        const { issue_id, content, parent_comment_id } = req.body;
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!issue_id || !content) {
            return res.status(400).json({ error: 'Issue ID and content are required' });
        }

        if (content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }

        const comment = await CommentModel.createComment({
            issue_id,
            user_id,
            content: content.trim(),
            parent_comment_id: parent_comment_id || null
        });

        // Get the full comment with user info
        const fullComment = await CommentModel.getCommentById(comment.id);

        res.status(201).json(fullComment);
    } catch (err) {
        console.error('Error creating comment:', err);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Update a comment (only by author)
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }

        const updatedComment = await CommentModel.updateComment(id, content.trim(), user_id);

        if (!updatedComment) {
            return res.status(404).json({ error: 'Comment not found or you do not have permission to edit it' });
        }

        // Get the full updated comment with user info
        const fullComment = await CommentModel.getCommentById(updatedComment.id);

        res.json(fullComment);
    } catch (err) {
        console.error('Error updating comment:', err);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// Delete a comment (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;
        const user_role = req.user?.role;

        if (!user_id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const deletedComment = await CommentModel.deleteComment(id, user_id, user_role);

        if (!deletedComment) {
            return res.status(404).json({ error: 'Comment not found or you do not have permission to delete it' });
        }

        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// Get comment count for an issue
router.get('/issue/:issueId/count', async (req, res) => {
    try {
        const { issueId } = req.params;
        const count = await CommentModel.getCommentsCount(issueId);
        res.json({ count });
    } catch (err) {
        console.error('Error fetching comment count:', err);
        res.status(500).json({ error: 'Failed to fetch comment count' });
    }
});

module.exports = router;
