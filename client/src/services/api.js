const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to get headers with auth token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const fetchUsers = async () => {
  const res = await fetch(`${BASE_URL}/api/users`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const createUser = async (userData) => {
  const res = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
};

export const fetchIssues = async () => {
  const res = await fetch(`${BASE_URL}/api/issues`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json();
};

export const createIssue = async (issueData) => {
  const res = await fetch(`${BASE_URL}/api/issues`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(issueData),
  });
  if (!res.ok) throw new Error('Failed to create issue');
  return res.json();
};

export const updateIssue = async (id, updatedData) => {
  const res = await fetch(`${BASE_URL}/api/issues/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw new Error('Failed to update issue');
  return res.json();
};

export const deleteIssue = async (id) => {
  const res = await fetch(`${BASE_URL}/api/issues/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete issue');
  return res.json();
};

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