// server/src/routes/testRoutes.js
// Temporary test routes to verify DB model logic before building full API

const express = require('express');
const router = express.Router();

const UserModel = require('../models/userModel');
const IssueModel = require('../models/issueModel');

router.post('/create-user', async (req, res) => {
  const { email, name, role } = req.body;
  try {
    const user = await UserModel.createUser({ email, name, role });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/user/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const user = await UserModel.getUserByEmail(email);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/create-issue', async (req, res) => {
  const { title, description, assigned_to } = req.body;
  try {
    const issue = await IssueModel.createIssue({ title, description, assigned_to });
    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

router.get('/issues', async (req, res) => {
  try {
    const issues = await IssueModel.getAllIssues();
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

module.exports = router; 
