import { useEffect, useState } from 'react';
import { fetchIssues, deleteIssue } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function IssueList() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIssues()
      .then(setIssues)
      .catch(() => setError('Failed to fetch issues'))
      .finally(() => setLoading(false));
  }, []);

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedIssues([]);
  };

  const handleCheckboxChange = (issueId) => {
    setSelectedIssues((prev) =>
      prev.includes(issueId)
        ? prev.filter((id) => id !== issueId)
        : [...prev, issueId]
    );
  };

  const deleteSelectedIssues = async () => {
    try {
      const deletePromises = selectedIssues.map((id) => deleteIssue(id));
      await Promise.all(deletePromises);
      setIssues(issues.filter((issue) => !selectedIssues.includes(issue.id)));
      setSelectedIssues([]);
      setDeleteMode(false);
      setConfirmDelete(false);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete issues.');
    }
  };

  if (loading)
    return (
      <p className="p">Loading issues...</p>
    );
  if (error)
    return (
      <p className="alert error">{error}</p>
    );

  return (
    <div className="container">
      <div className="flex space-between middle mb-3">
        <h2 className="title">All Issues</h2>
        <Link to="/issues/create" className="button primary small">
          + New Issue
        </Link>
      </div>

      {deleteMode ? (
        <div className="flex gap">
          <button className="button secondary small" onClick={toggleDeleteMode}>
            Cancel
          </button>
          <button
            disabled={selectedIssues.length === 0}
            onClick={() => setConfirmDelete(true)}
            className={`button danger small${selectedIssues.length === 0 ? ' disabled' : ''}`}
          >
            Delete ({selectedIssues.length})
          </button>
        </div>
      ) : (
        <button className="button danger small mb-3" onClick={toggleDeleteMode}>
          Delete
        </button>
      )}

      {issues.length === 0 ? (
        <p className="text-muted mt-3">🚫 No issues found. Create one above.</p>
      ) : (
        <ul>
          {issues.map((issue) => (
            <li
              key={issue.id}
              className="card card-hover flex middle gap"
              style={{ cursor: deleteMode ? 'default' : 'pointer' }}
              onClick={() => !deleteMode && navigate(`/issues/${issue.id}`)}
            >
              {deleteMode && (
                <input
                  type="checkbox"
                  checked={selectedIssues.includes(issue.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCheckboxChange(issue.id);
                  }}
                />
              )}
              <div className="flex-grow">
                <h3>{issue.title}</h3>
                <p className="text-muted">{issue.description}</p>
                <div className="flex gap wrap mt-1">
                  <span className="badge primary" style={{ textTransform: 'capitalize' }}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span className="badge secondary">
                    {issue.assigned_to ? `Assigned to ${issue.assigned_to}` : 'Unassigned'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirmDelete && (
        <div className="modal">
          <div className="card p">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete the following issues?</p>
            <ul className="list">
              {issues
                .filter((issue) => selectedIssues.includes(issue.id))
                .map((issue) => (
                  <li key={issue.id}>{issue.title}</li>
                ))}
            </ul>
            <div className="flex gap right mt-3">
              <button className="button secondary" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="button danger" onClick={deleteSelectedIssues}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
