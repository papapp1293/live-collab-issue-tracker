const express = require('express');
const router = express.Router();
const IssueModel = require('../models/issueModel');
const UserModel = require('../models/userModel');
const openaiService = require('../services/openaiService');

// Get issues based on user role
router.get('/', async (req, res) => {
  try {
    const userRole = req.user?.role;
    let issues;

    if (userRole === 'manager') {
      // Managers see all issues with assignment status
      issues = await IssueModel.getIssuesForManager();
    } else {
      // Developers and testers see all issues
      issues = await IssueModel.getAllIssues();
    }

    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Get issues assigned to the current user
router.get('/my-issues', async (req, res) => {
  try {
    // req.user should be available from auth middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const issues = await IssueModel.getIssuesByUserId(userId);
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user issues' });
  }
});

// Create a new issue
router.post('/', async (req, res) => {
  try {
    const { title, description, assigned_developer, assigned_tester } = req.body;

    // Generate AI summary if OpenAI is configured
    let aiSummary = null;
    if (openaiService.isConfigured()) {
      try {
        const estimatedCost = openaiService.estimateRequestCost(title, description);
        console.log(`Generating AI summary (estimated cost: $${estimatedCost.toFixed(6)})`);
        aiSummary = await openaiService.generateIssueSummary(title, description);
      } catch (error) {
        console.warn('Failed to generate AI summary:', error.message);
        // Continue without AI summary - this is not a blocking error
      }
    }

    const issue = await IssueModel.createIssue({
      title,
      description,
      assigned_developer,
      assigned_tester,
      ai_summary: aiSummary
    });

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
    const { assigned_developer, assigned_tester, ...otherUpdates } = req.body;

    // Check if user is trying to update assignments
    if ((assigned_developer !== undefined || assigned_tester !== undefined) && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can assign developers and testers' });
    }

    // Build the update object
    const updates = { ...otherUpdates };

    // Only include assignment fields if user is a manager
    if (req.user?.role === 'manager') {
      if (assigned_developer !== undefined) updates.assigned_developer = assigned_developer;
      if (assigned_tester !== undefined) updates.assigned_tester = assigned_tester;
    }

    const updated = await IssueModel.updateIssue(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Issue not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Get AI cost statistics (for monitoring)
router.get('/ai/stats', async (req, res) => {
  try {
    if (!openaiService.isConfigured()) {
      return res.status(400).json({ error: 'AI service not configured' });
    }

    const stats = openaiService.getCostStats();
    res.json({
      message: 'AI usage statistics',
      stats
    });
  } catch (err) {
    console.error('Error getting AI stats:', err);
    res.status(500).json({ error: 'Failed to get AI statistics' });
  }
});

// Generate AI summary for an existing issue
router.post('/:id/generate-summary', async (req, res) => {
  try {
    const issueId = req.params.id;

    console.log(`Generating AI summary for issue ${issueId}`);

    // Check if OpenAI is configured
    if (!openaiService.isConfigured()) {
      console.log('OpenAI not configured');
      return res.status(400).json({ error: 'AI service not configured' });
    }

    // Get the current issue
    const issue = await IssueModel.getIssueById(issueId);
    if (!issue) {
      console.log(`Issue ${issueId} not found`);
      return res.status(404).json({ error: 'Issue not found' });
    }

    console.log(`Found issue: ${issue.title}`);

    // Estimate and log cost
    const estimatedCost = openaiService.estimateRequestCost(issue.title, issue.description);
    console.log(`Regenerating AI summary (estimated cost: $${estimatedCost.toFixed(6)})`);

    // Generate AI summary
    const aiSummary = await openaiService.generateIssueSummary(issue.title, issue.description);

    if (!aiSummary) {
      console.log('AI summary generation returned null');
      return res.status(500).json({ error: 'Failed to generate AI summary' });
    }

    console.log(`Generated AI summary: ${aiSummary}`);

    // Update the issue with the new AI summary
    const updatedIssue = await IssueModel.updateAISummary(issueId, aiSummary);

    console.log('Updated issue with AI summary');

    res.json({
      message: 'AI summary generated successfully',
      ai_summary: aiSummary,
      issue: updatedIssue
    });
  } catch (err) {
    console.error('Error in generate-summary route:', err);
    res.status(500).json({ error: 'Failed to generate AI summary: ' + err.message });
  }
});

// Assign developer to issue
router.post('/:id/assign-developer', async (req, res) => {
  try {
    // Only managers can assign
    if (req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can assign developers' });
    }

    const { developerId } = req.body;
    const issueId = req.params.id;

    const updatedIssue = await IssueModel.assignDeveloper(issueId, developerId);
    if (!updatedIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ message: 'Developer assigned successfully', issue: updatedIssue });
  } catch (err) {
    console.error('Error assigning developer:', err);
    res.status(500).json({ error: 'Failed to assign developer' });
  }
});

// Assign tester to issue
router.post('/:id/assign-tester', async (req, res) => {
  try {
    // Only managers can assign
    if (req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can assign testers' });
    }

    const { testerId } = req.body;
    const issueId = req.params.id;

    const updatedIssue = await IssueModel.assignTester(issueId, testerId);
    if (!updatedIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ message: 'Tester assigned successfully', issue: updatedIssue });
  } catch (err) {
    console.error('Error assigning tester:', err);
    res.status(500).json({ error: 'Failed to assign tester' });
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
