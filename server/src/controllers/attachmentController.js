// server/src/controllers/attachmentController.js
const AttachmentModel = require('../models/attachmentModel');
const fs = require('fs');
const path = require('path');

class AttachmentController {
    static async upload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { issue_id, comment_id } = req.body;

            if (!issue_id) {
                return res.status(400).json({ error: 'Issue ID is required' });
            }

            const attachmentData = {
                issue_id: parseInt(issue_id),
                comment_id: comment_id ? parseInt(comment_id) : null,
                user_id: req.user?.id || req.user?.userId,
                file_path: req.file.path,
                file_name: req.file.originalname,
                file_type: req.file.mimetype
            };

            const attachment = await AttachmentModel.create(attachmentData);

            res.status(201).json({
                message: 'File uploaded successfully',
                attachment
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            res.status(500).json({ error: 'Failed to upload file', details: error.message });
        }
    }

    static async getByIssue(req, res) {
        try {
            const { issueId } = req.params;
            const attachments = await AttachmentModel.getByIssueId(parseInt(issueId));
            res.json(attachments);
        } catch (error) {
            console.error('Error fetching attachments:', error);
            res.status(500).json({ error: 'Failed to fetch attachments' });
        }
    }

    static async getByComment(req, res) {
        try {
            const { commentId } = req.params;
            const attachments = await AttachmentModel.getByCommentId(parseInt(commentId));
            res.json(attachments);
        } catch (error) {
            console.error('Error fetching attachments:', error);
            res.status(500).json({ error: 'Failed to fetch attachments' });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const attachment = await AttachmentModel.deleteById(parseInt(id));

            if (!attachment) {
                return res.status(404).json({ error: 'Attachment not found' });
            }

            // Delete the actual file
            if (fs.existsSync(attachment.file_path)) {
                fs.unlinkSync(attachment.file_path);
            }

            res.json({ message: 'Attachment deleted successfully' });
        } catch (error) {
            console.error('Error deleting attachment:', error);
            res.status(500).json({ error: 'Failed to delete attachment' });
        }
    } static async serve(req, res) {
        try {
            const { id } = req.params;
            const query = 'SELECT * FROM attachments WHERE id = $1';
            const result = await require('../utils/db').query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Attachment not found' });
            }

            const attachment = result.rows[0];
            const filePath = path.resolve(attachment.file_path);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found on disk' });
            }

            res.setHeader('Content-Type', attachment.mime_type);
            res.setHeader('Content-Disposition', `inline; filename="${attachment.filename}"`);
            res.sendFile(filePath);
        } catch (error) {
            console.error('Error serving file:', error);
            res.status(500).json({ error: 'Failed to serve file' });
        }
    }
}

module.exports = AttachmentController;
