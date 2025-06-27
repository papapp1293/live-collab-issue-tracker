import { useEffect, useState } from 'react';
import { fetchIssues } from '../services/api';
import { Link } from 'react-router-dom';

export default function IssueList() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIssues()
      .then(setIssues)
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch issues');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading issues...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">All Issues</h2>
      <Link to="/issues/create" className="text-blue-600 underline">
  + New Issue
</Link>
      <ul className="space-y-2">
        {issues.map((issue) => (
          <li key={issue.id} className="border p-4 rounded shadow">
            <p><strong>Title:</strong> {issue.title}</p>
            <p><strong>Description:</strong> {issue.description}</p>
            <p><strong>Status:</strong> {issue.status}</p>
            <p><strong>Assigned To:</strong> {issue.assigned_to}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
