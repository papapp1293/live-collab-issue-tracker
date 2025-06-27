const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchUsers = async () => {
  const res = await fetch(`${BASE_URL}/api/users`);
  return res.json();
};

export const createUser = async (userData) => {
  const res = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return res.json();
};

export const fetchIssues = async () => {
  const res = await fetch(`${BASE_URL}/api/issues`);
  return res.json();
};

export const createIssue = async (issueData) => {
  const res = await fetch(`${BASE_URL}/api/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(issueData),
  });
  return res.json();
};
