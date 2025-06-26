// server/src/app.js
// Sets up the Express app, middleware, and route mounting logic.

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

//const authRoutes = require('./routes/authRoutes');
//const issueRoutes = require('./routes/issueRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
//app.use('/api/auth', authRoutes);
//app.use('/api/issues', issueRoutes);

// Test Routes
const testRoutes = require('./routes/testRoutes');
app.use('/api/test', testRoutes);


module.exports = app;
