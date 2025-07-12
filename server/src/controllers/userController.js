// server/src/controllers/userController.js
const UserModel = require('../models/userModel');

// Utility function to remove password from user object(s)
const sanitizeUser = (user) => {
    if (!user) return null;
    const { password, ...userSafe } = user;
    return userSafe;
};

const sanitizeUsers = (users) => {
    if (!Array.isArray(users)) return [];
    return users.map(sanitizeUser);
};

// Utility function to handle async controller methods with error handling
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        console.error('Controller error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });
};

const userController = {
    // Create a new user
    createUser: async (req, res) => {
        try {
            const { email, name, role } = req.body;

            // Basic validation
            if (!email || !name) {
                return res.status(400).json({ error: 'Email and name are required' });
            }

            const user = await UserModel.createUser({ email, name, role });
            res.status(201).json(user);
        } catch (err) {
            console.error('Error creating user:', err);
            res.status(500).json({ error: 'Failed to create user' });
        }
    },

    // Get user by ID
    getUserById: async (req, res) => {
        try {
            const user = await UserModel.getUserById(req.params.id);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(sanitizeUser(user));
        } catch (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ error: 'Failed to get user' });
        }
    },

    // Get all users
    getAllUsers: async (req, res) => {
        try {
            const users = await UserModel.getAllUsers();
            res.json(sanitizeUsers(users));
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    },

    // Update user info (partial update)
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Remove password from update data - passwords should be updated through separate endpoint
            delete updateData.password;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            const updatedUser = await UserModel.updateUser(id, updateData);

            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(sanitizeUser(updatedUser));
        } catch (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ error: 'Failed to update user' });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            // Check if user exists first
            const user = await UserModel.getUserById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const deleted = await UserModel.deleteUser(id);

            if (deleted) {
                res.json({ message: 'User deleted successfully' });
            } else {
                res.status(500).json({ error: 'Failed to delete user' });
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    },

    // Get users by role (for assignment dropdowns)
    getUsersByRole: async (req, res) => {
        console.log('🔍 getUsersByRole called');
        console.log('Request params:', req.params);
        console.log('Request user:', req.user);

        try {
            const { role } = req.params;
            console.log('Requested role:', role);

            // Validate role
            if (!['developer', 'tester'].includes(role)) {
                console.log('❌ Invalid role:', role);
                return res.status(400).json({ error: 'Invalid role. Must be developer or tester' });
            }

            console.log('✅ Fetching users with role:', role);
            const users = await UserModel.getUsersByRole(role);
            console.log('Users found:', users.length);

            console.log('✅ Returning users:', users.length);
            res.json(sanitizeUsers(users));
        } catch (err) {
            console.error('❌ Error fetching users by role:', err);
            res.status(500).json({ error: 'Failed to fetch users by role' });
        }
    }
};

module.exports = userController;
