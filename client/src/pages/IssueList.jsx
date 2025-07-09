import { useEffect, useState } from 'react';
import { fetchIssues, deleteIssue } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import socketService from '../services/socket';

export default function IssueList() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // issueId -> Set of users
  const navigate = useNavigate();

  useEffect(() => {
    fetchIssues()
      .then(data => {
        if (Array.isArray(data)) {
          setIssues(data);
        } else {
          setIssues([]);
          setError('Invalid data received from server');
        }
      })
      .catch((err) => {
        setIssues([]);
        setError(err.message || 'Failed to fetch issues');
      })
      .finally(() => setLoading(false));

    // Set up Socket.IO listeners for real-time updates
    socketService.onIssueCreated((newIssue) => {
      console.log('📝 Real-time: New issue created', newIssue);
      setIssues(prevIssues => [newIssue, ...prevIssues]);
    });

    socketService.onIssueUpdated((updatedIssue) => {
      console.log('📝 Real-time: Issue updated', updatedIssue);
      setIssues(prevIssues =>
        prevIssues.map(issue =>
          issue.id === updatedIssue.id ? { ...issue, ...updatedIssue } : issue
        )
      );
    });

    socketService.onIssueDeleted((deletedIssue) => {
      console.log('🗑️ Real-time: Issue deleted', deletedIssue);
      setIssues(prevIssues =>
        prevIssues.filter(issue => issue.id !== deletedIssue.id)
      );
    });

    socketService.onUserOnline((user) => {
      console.log('✅ User came online:', user.userEmail);
      setOnlineUsers(prev => new Set([...prev, user.userId]));
    });

    socketService.onUserOffline((user) => {
      console.log('❌ User went offline:', user.userEmail);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.userId);
        return newSet;
      });
    });

    socketService.onUserTyping(({ issueId, userId, userEmail, isTyping }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(issueId)) {
          newMap.set(issueId, new Set());
        }
        const usersTyping = newMap.get(issueId);

        if (isTyping) {
          usersTyping.add(userEmail);
        } else {
          usersTyping.delete(userEmail);
        }

        if (usersTyping.size === 0) {
          newMap.delete(issueId);
        }

        return newMap;
      });
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.removeListener('issue:created');
      socketService.removeListener('issue:updated');
      socketService.removeListener('issue:deleted');
      socketService.removeListener('user:online');
      socketService.removeListener('user:offline');
      socketService.removeListener('issue:typing');
    };
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
        <div className="flex middle gap">
          <h2 className="title">All Issues</h2>
          {issues.length > 0 && (
            <span className="badge primary small">
              {issues.length} issue{issues.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="badge success small">
            🟢 Live Updates
          </span>
          {onlineUsers.size > 0 && (
            <span className="badge secondary small">
              {onlineUsers.size} user{onlineUsers.size !== 1 ? 's' : ''} online
            </span>
          )}
        </div>
        <div className="flex gap">
          <Link to="/" className="button secondary small">
            🏠 Home
          </Link>
          <Link to="/issues/create" className="button primary small">
            + New Issue
          </Link>
        </div>
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
                <div className="flex middle gap">
                  <h3>{issue.title}</h3>
                  {typingUsers.has(issue.id) && (
                    <span className="badge warning small animate-pulse">
                      ✏️ {Array.from(typingUsers.get(issue.id)).join(', ')} editing...
                    </span>
                  )}
                </div>

                {issue.ai_summary ? (
                  <div className="alert success mt-2 mb-2" style={{ padding: '8px 12px' }}>
                    <strong>🤖 AI Summary:</strong> {issue.ai_summary}
                  </div>
                ) : (
                  <p className="text-muted">{issue.description}</p>
                )}

                <div className="flex gap wrap mt-1">
                  <span className="badge primary" style={{ textTransform: 'capitalize' }}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex gap wrap mt-1">
                  {issue.assigned_developer_name && (
                    <span className="badge secondary">
                      Developer: {issue.assigned_developer_name}
                    </span>
                  )}
                  {issue.assigned_tester_name && (
                    <span className="badge secondary">
                      Tester: {issue.assigned_tester_name}
                    </span>
                  )}
                  {!issue.assigned_developer_name && !issue.assigned_tester_name && (
                    <span className="badge danger">
                      Unassigned
                    </span>
                  )}
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
