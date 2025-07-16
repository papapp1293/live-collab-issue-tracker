// server/src/routes/attachmentRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const AttachmentController = require('../controllers/attachmentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Routes
router.post('/upload', authMiddleware, upload.single('file'), AttachmentController.upload);
router.get('/issue/:issueId', authMiddleware, AttachmentController.getByIssue);
router.get('/comment/:commentId', authMiddleware, AttachmentController.getByComment);
router.get('/serve/:id', AttachmentController.serve); // No auth for serving files
router.delete('/:id', authMiddleware, AttachmentController.delete);

module.exports = router;
