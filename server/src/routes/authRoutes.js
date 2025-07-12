// server/src/routes/authRoutes.js
const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();

// Register route - delegates to controller
router.post('/register', register);

// Login route - delegates to controller  
router.post('/login', login);

module.exports = router;
