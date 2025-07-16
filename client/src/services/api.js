const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to get headers with auth token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Fetch all users in the system (for admin/assignment purposes)
export const fetchUsers = async () => {
  const res = await fetch(`${BASE_URL}/api/users`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

// Create a new user account
export const createUser = async (userData) => {
  const res = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
};

// Fetch ALL issues in the system (used in IssueList page to show all issues)
export const fetchIssues = async () => {
  const res = await fetch(`${BASE_URL}/api/issues`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json();
};

// Fetch ONLY issues assigned to the current authenticated user (used in Dashboard)
export const fetchMyIssues = async () => {
  const res = await fetch(`${BASE_URL}/api/issues/my-issues`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch my issues');
  return res.json();
};

// Fetch a single issue by ID
export const fetchIssue = async (id) => {
  const res = await fetch(`${BASE_URL}/api/issues/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch issue');
  return res.json();
};

// Create a new issue
export const createIssue = async (issueData) => {
  const res = await fetch(`${BASE_URL}/api/issues`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(issueData),
  });
  if (!res.ok) throw new Error('Failed to create issue');
  return res.json();
};

// Update an existing issue (partial update - title, description, assigned_to, status)
export const updateIssue = async (id, updatedData) => {
  const res = await fetch(`${BASE_URL}/api/issues/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw new Error('Failed to update issue');
  return res.json();
};

// Delete an issue by ID
export const deleteIssue = async (id) => {
  const res = await fetch(`${BASE_URL}/api/issues/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete issue');
  return res.json();
};

// Authenticate user with email and password
export const login = async (credentials) => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  return res.json();
};

// Register a new user
export const register = async (userData) => {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  return res.json();
};

// Fetch users by role (centralized to avoid duplication)
export const fetchUsersByRole = async (role) => {
  try {
    const res = await fetch(`${BASE_URL}/api/users/role/${role}`, {
      headers: getHeaders(),
    });

    if (res.ok) {
      return await res.json();
    } else {
      const errorText = await res.text();
      console.error(`Failed to fetch ${role}s:`, {
        status: res.status,
        statusText: res.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch ${role}s: ${res.statusText}`);
    }
  } catch (error) {
    console.error(`Error in fetchUsersByRole for ${role}:`, error.message);
    throw error;
  }
};

// Assign developer to issue (manager only)
export const assignDeveloper = async (issueId, developerId) => {
  const res = await fetch(`${BASE_URL}/api/issues/${issueId}/assign-developer`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ developerId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to assign developer');
  }
  return res.json();
};

// Assign tester to issue (manager only)
export const assignTester = async (issueId, testerId) => {
  const res = await fetch(`${BASE_URL}/api/issues/${issueId}/assign-tester`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ testerId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to assign tester');
  }
  return res.json();
};

// Generate AI summary for an existing issue
export const generateAISummary = async (issueId) => {
  const res = await fetch(`${BASE_URL}/api/issues/${issueId}/generate-summary`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to generate AI summary');
  return res.json();
};

// ===== COMMENT API FUNCTIONS =====

// Get all comments for an issue (threaded)
export const fetchComments = async (issueId) => {
  const res = await fetch(`${BASE_URL}/api/comments/issue/${issueId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
};

// Create a new comment
export const createComment = async (issueId, content, parentCommentId = null) => {
  const res = await fetch(`${BASE_URL}/api/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      issue_id: issueId,
      content,
      parent_comment_id: parentCommentId,
    }),
  });
  if (!res.ok) throw new Error('Failed to create comment');
  return res.json();
};

// Update a comment
export const updateComment = async (commentId, content) => {
  const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to update comment');
  return res.json();
};

// Delete a comment
export const deleteComment = async (commentId) => {
  const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete comment');
  return res.json();
};

// Get comment count for an issue
export const getCommentCount = async (issueId) => {
  const res = await fetch(`${BASE_URL}/api/comments/issue/${issueId}/count`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch comment count');
  return res.json();
};

// Attachment API functions
export const uploadAttachment = async (file, issueId, commentId = null) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('issue_id', issueId);
  if (commentId) {
    formData.append('comment_id', commentId);
  }

  const res = await fetch(`${BASE_URL}/api/attachments/upload`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upload attachment: ${res.status} ${res.statusText} - ${errorText}`);
  }

  return res.json();
};

export const getAttachmentsByIssue = async (issueId) => {
  const res = await fetch(`${BASE_URL}/api/attachments/issue/${issueId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch attachments');
  return res.json();
};

export const getAttachmentsByComment = async (commentId) => {
  const res = await fetch(`${BASE_URL}/api/attachments/comment/${commentId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch attachments');
  return res.json();
};

export const deleteAttachment = async (attachmentId) => {
  const res = await fetch(`${BASE_URL}/api/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete attachment');
  return res.json();
};

export const getAttachmentUrl = (attachmentId) => {
  return `${BASE_URL}/api/attachments/serve/${attachmentId}`;
};