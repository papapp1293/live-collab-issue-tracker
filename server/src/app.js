// server/src/app.js
// Sets up the Express app, middleware, and route mounting logic.
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const userRoutes = require('./routes/userRoutes');
const issueRoutes = require('./routes/issueRoutes');
const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const authenticateToken = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));


// Public Routes
app.use('/api/auth', authRoutes);
// Private Routes
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/issues', authenticateToken, issueRoutes);
app.use('/api/comments', authenticateToken, commentRoutes);
app.use('/api/attachments', attachmentRoutes);

// Default error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
