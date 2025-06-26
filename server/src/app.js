// server/src/app.js
// Sets up the Express app, middleware, and route mounting logic.
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const userRoutes = require('./routes/userRoutes');
const issueRoutes = require('./routes/issueRoutes');
// Test Routes
const testRoutes = require('./routes/testRoutes');

dotenv.config();

const app = express();
// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
// Default error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
