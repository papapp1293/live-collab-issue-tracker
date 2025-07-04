const express = require('express');
const router = express.Router();
const IssueModel = require('../models/issueModel');

// Create a new issue
router.post('/', async (req, res) => {
  try {
    const { title, description, assigned_to } = req.body;
    const issue = await IssueModel.createIssue({ title, description, assigned_to });
    res.status(201).json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// Get all issues
router.get('/', async (req, res) => {
  try {
    const issues = await IssueModel.getAllIssues();
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Get issue by ID
router.get('/:id', async (req, res) => {
  try {
    const issue = await IssueModel.getIssueById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get issue' });
  }
});

// Partial update (title, description, assigned_to, status)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await IssueModel.updateIssue(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Issue not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});


// Delete issue
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await IssueModel.deleteIssue(req.params.id); // Implement in model
    if (!deleted) return res.status(404).json({ error: 'Issue not found' });
    res.json({ message: 'Issue deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

module.exports = router;
