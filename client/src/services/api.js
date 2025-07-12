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

// Fetch users by role with comprehensive debugging (centralized to avoid duplication)
export const fetchUsersByRole = async (role, debugContext = 'unknown') => {
  console.log(`🔍 [${debugContext}] fetchUsersByRole called with role: "${role}"`);

  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    console.log(`📋 [${debugContext}] Current user:`, {
      id: user.id,
      email: user.email,
      role: user.role
    });
    console.log(`🔑 [${debugContext}] Token exists:`, !!token);
    console.log(`🎯 [${debugContext}] Making request to: ${BASE_URL}/api/users/role/${role}`);

    const res = await fetch(`${BASE_URL}/api/users/role/${role}`, {
      headers: getHeaders(),
    });

    console.log(`📡 [${debugContext}] Response status:`, res.status);
    console.log(`📡 [${debugContext}] Response ok:`, res.ok);

    if (res.ok) {
      const data = await res.json();
      console.log(`✅ [${debugContext}] Successfully fetched ${data.length} ${role}s:`, data);
      return data;
    } else {
      const errorText = await res.text();
      console.error(`❌ [${debugContext}] Failed to fetch ${role}s:`, {
        status: res.status,
        statusText: res.statusText,
        error: errorText
      });

      // Try to parse as JSON for better error details
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`❌ [${debugContext}] Parsed error:`, errorJson);
      } catch (e) {
        console.error(`❌ [${debugContext}] Raw error response:`, errorText);
      }

      throw new Error(`Failed to fetch ${role}s: ${res.statusText}`);
    }
  } catch (error) {
    console.error(`💥 [${debugContext}] Exception in fetchUsersByRole:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error; // Re-throw to maintain error handling in components
  }
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