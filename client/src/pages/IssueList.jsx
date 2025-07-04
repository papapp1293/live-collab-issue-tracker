import { useEffect, useState } from 'react';
import { fetchIssues, deleteIssue } from '../services/api';
import { Link } from 'react-router-dom';

export default function IssueList() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedIssues([]); // clear selection when entering/exiting
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
      const deletePromises = selectedIssues.map((id) =>
        deleteIssue(id)
      );

      await Promise.all(deletePromises);

      // Refresh UI
      const updatedIssues = issues.filter((issue) => !selectedIssues.includes(issue.id));
      setIssues(updatedIssues);
      setSelectedIssues([]);
      setDeleteMode(false);
      setConfirmDelete(false);
    } catch (err) {
      console.error('Failed to delete issues:', err);
      alert('Failed to delete selected issues.');
    }
  };

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
      <div className="mt-4 space-x-2">
        {!deleteMode ? (
          <button
            className="bg-red-500 text-white px-3 py-1 rounded"
            onClick={toggleDeleteMode}
          >
            Delete
          </button>
        ) : (
          <>
            <button
              className="bg-gray-300 text-black px-3 py-1 rounded"
              onClick={toggleDeleteMode}
            >
              Cancel
            </button>
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => setConfirmDelete(true)}
              disabled={selectedIssues.length === 0}
            >
              Delete ({selectedIssues.length})
            </button>
          </>
        )}
      </div>
      <ul className="space-y-2">
        {issues.map((issue) => (
          <li key={issue.id} className="border p-4 rounded shadow flex items-start">
            {deleteMode && (
              <input
                type="checkbox"
                className="mr-4 mt-1"
                checked={selectedIssues.includes(issue.id)}
                onChange={() => handleCheckboxChange(issue.id)}
              />
            )}
            <div>
              <p><strong>Title:</strong> {issue.title}</p>
              <p><strong>Description:</strong> {issue.description}</p>
              <p><strong>Status:</strong> {issue.status}</p>
              <p><strong>Assigned To:</strong> {issue.assigned_to}</p>
            </div>
          </li>
        ))}
      </ul>

      {
        confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
              <p className="mb-4">Are you sure you want to delete the following issues?</p>
              <ul className="list-disc ml-5 mb-4">
                {issues
                  .filter((issue) => selectedIssues.includes(issue.id))
                  .map((issue) => (
                    <li key={issue.id}>{issue.title}</li>
                  ))}
              </ul>
              <div className="flex justify-end space-x-2">
                <button
                  className="bg-gray-300 px-4 py-2 rounded"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded"
                  onClick={deleteSelectedIssues}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
