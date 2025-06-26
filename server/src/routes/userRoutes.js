const express = require('express');
const router = express.Router();
const UserModel = require('../models/userModel');

// Create a new user (register)
router.post('/', async (req, res) => {
  try {
    const { email, name, role } = req.body;
    const user = await UserModel.createUser({ email, name, role });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await UserModel.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    // Ideally implement pagination here for real apps
    const users = await UserModel.getAllUsers(); // Add this method to model
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user info (partial update)
router.patch('/:id', async (req, res) => {
  try {
    const updatedUser = await UserModel.updateUser(req.params.id, req.body); // Implement in model
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await UserModel.deleteUser(req.params.id); // Implement in model
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
