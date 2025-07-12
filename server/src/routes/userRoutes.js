// server/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users (must come before /:id)
router.get('/', userController.getAllUsers);

// Get users by role (for assignment dropdowns) - must come before /:id
router.get('/role/:role', userController.getUsersByRole);

// Create a new user
router.post('/', userController.createUser);

// Get user by ID (must come after specific routes)
router.get('/:id', userController.getUserById);

// Update user info (partial update)
router.patch('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
