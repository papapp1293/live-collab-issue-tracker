import { useEffect, useState } from 'react';
import { fetchIssues, deleteIssue, fetchUsersByRole, assignDeveloper, assignTester } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import AdvancedSearch from '../components/AdvancedSearch';
import SearchResults from '../components/SearchResults';

export default function IssueList() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // issueId -> Set of users
  const [developers, setDevelopers] = useState([]);
  const [testers, setTesters] = useState([]);
  const [assignmentModal, setAssignmentModal] = useState(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState('');
  const [selectedTester, setSelectedTester] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'search'
  const navigate = useNavigate();
  const { user } = useAuth();

  // Advanced search functionality
  const {
    searchResults,
    pagination,
    loading: searchLoading,
    error: searchError,
    filters,
    filterOptions,
    hasActiveFilters,
    handleSearch,
    handleLoadMore,
    clearSearch,
    getSearchSummary
  } = useAdvancedSearch();

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

  // Fetch developers and testers for managers
  useEffect(() => {
    if (user?.role === 'manager') {
      fetchUsersByRole('developer').then(setDevelopers).catch(console.error);
      fetchUsersByRole('tester').then(setTesters).catch(console.error);
    }
  }, [user?.role]);

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

  const handleAssignDeveloper = async (issueId, developerId) => {
    try {
      await assignDeveloper(issueId, developerId);
      // Refresh issues after successful assignment
      const updatedIssues = await fetchIssues();
      setIssues(updatedIssues);
      return true;
    } catch (err) {
      console.error('Error assigning developer:', err);
      alert(err.message || 'Failed to assign developer');
      return false;
    }
  };

  const handleAssignTester = async (issueId, testerId) => {
    try {
      await assignTester(issueId, testerId);
      // Refresh issues after successful assignment
      const updatedIssues = await fetchIssues();
      setIssues(updatedIssues);
      return true;
    } catch (err) {
      console.error('Error assigning tester:', err);
      alert(err.message || 'Failed to assign tester');
      return false;
    }
  };

  const openAssignmentModal = (issue) => {
    setAssignmentModal({
      issueId: issue.id,
      issueTitle: issue.title,
      currentDeveloper: issue.assigned_developer,
      currentTester: issue.assigned_tester,
      currentDeveloperName: issue.assigned_developer_name,
      currentTesterName: issue.assigned_tester_name
    });
    setSelectedDeveloper(issue.assigned_developer || '');
    setSelectedTester(issue.assigned_tester || '');
  };

  const closeAssignmentModal = () => {
    setAssignmentModal(null);
    setSelectedDeveloper('');
    setSelectedTester('');
  };

  const confirmAssignments = async () => {
    if (!assignmentModal) return;

    let success = true;

    if (selectedDeveloper !== assignmentModal.currentDeveloper) {
      success = await handleAssignDeveloper(assignmentModal.issueId, selectedDeveloper || null);
    }

    if (success && selectedTester !== assignmentModal.currentTester) {
      success = await handleAssignTester(assignmentModal.issueId, selectedTester || null);
    }

    if (success) {
      closeAssignmentModal();
      // Refresh data based on current view mode
      if (viewMode === 'search' && hasActiveFilters) {
        handleSearch(filters);
      } else {
        // Refresh all issues
        const updatedIssues = await fetchIssues();
        setIssues(updatedIssues);
      }
    }
  };

  // Handle switching between view modes
  const handleSearchModeToggle = (enableSearch) => {
    setViewMode(enableSearch ? 'search' : 'all');
  };

  // Handle search
  const onSearch = (searchFilters) => {
    setViewMode('search');
    handleSearch(searchFilters);
  };

  // Handle clear search
  const onClearSearch = () => {
    setViewMode('all');
    clearSearch();
  };

  // Handle assignment actions from search results
  const handleIssueAction = (action, issue) => {
    if (action === 'assign') {
      openAssignmentModal(issue);
    }
  };

  // Get current data based on view mode
  const getCurrentData = () => {
    if (viewMode === 'search') {
      return {
        issues: searchResults,
        loading: searchLoading,
        error: searchError,
        pagination
      };
    }

    return {
      issues,
      loading,
      error,
      pagination: null
    };
  };

  const currentData = getCurrentData();

  // Only show loading/error for initial "all issues" load
  if (viewMode === 'all' && loading && issues.length === 0) {
    return <p className="p">Loading issues...</p>;
  }

  if (viewMode === 'all' && error && issues.length === 0) {
    return <p className="alert error">{error}</p>;
  }

  return (
    <div className="container">
      <div className="flex space-between middle mb-4">
        <div className="flex middle gap">
          <h2 className="title">All Issues</h2>
          {viewMode === 'search' && hasActiveFilters && (
            <span className="badge primary small">
              Search: {getSearchSummary()}
            </span>
          )}
          {currentData.issues.length > 0 && (
            <span className="badge primary small">
              {currentData.pagination?.total || currentData.issues.length} issue{(currentData.pagination?.total || currentData.issues.length) !== 1 ? 's' : ''}
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

      {/* Advanced Search Component */}
      <AdvancedSearch
        onSearch={onSearch}
        onClear={onClearSearch}
        filterOptions={filterOptions}
        initialFilters={filters}
        loading={searchLoading}
      />

      {/* Toggle between view modes */}
      {viewMode === 'search' && (
        <div className="flex space-between middle mb-4">
          <button
            onClick={() => handleSearchModeToggle(false)}
            className="button secondary small"
          >
            ← Back to All Issues
          </button>
          <div className="text-muted">
            {hasActiveFilters ? 'Showing filtered results' : 'Showing all issues'}
          </div>
        </div>
      )}

      {/* Results Display */}
      {viewMode === 'search' ? (
        <>
          {currentData.error && (
            <div className="alert error mb-4">
              <strong>Search Error:</strong> {currentData.error}
            </div>
          )}
          <SearchResults
            issues={currentData.issues}
            pagination={currentData.pagination}
            loading={currentData.loading}
            onLoadMore={handleLoadMore}
            onIssueAction={handleIssueAction}
            showActions={true}
            showAssignments={true}
          />
        </>
      ) : (
        <>
          {/* Original Issue List UI for "All Issues" mode */}
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

          {currentData.issues.length === 0 && !currentData.loading ? (
            <p className="text-muted mt-3">🚫 No issues found. Create one above.</p>
          ) : (
            <ul>
              {currentData.issues.map((issue) => (
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
                      <div
                        className="text-muted"
                        dangerouslySetInnerHTML={{ __html: issue.description }}
                      />
                    )}

                    <div className="flex gap wrap mt-1">
                      <span className="badge primary" style={{ textTransform: 'capitalize' }}>
                        {issue.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1">
                      {issue.assigned_developer_name && (
                        <div className="mb-1">
                          <span className="badge secondary">
                            Developer: {issue.assigned_developer_name}
                          </span>
                        </div>
                      )}
                      {issue.assigned_tester_name && (
                        <div className="mb-1">
                          <span className="badge secondary">
                            Tester: {issue.assigned_tester_name}
                          </span>
                        </div>
                      )}
                      {!issue.assigned_developer_name && !issue.assigned_tester_name && (
                        <div className="mb-1">
                          <span className="badge danger">
                            Unassigned
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {user?.role === 'manager' && (
                    <div className="flex gap" style={{ marginLeft: '1rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssignmentModal(issue);
                        }}
                        className="button primary small"
                      >
                        👥 Assign
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
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

      {/* Assignment Modal */}
      {assignmentModal && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card p" style={{ width: '600px', maxWidth: '90vw' }}>
            <div className="flex space-between middle mb-3">
              <h3>Assign Team Members</h3>
              <button
                onClick={closeAssignmentModal}
                className="button secondary small"
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div className="mb-3">
              <h4 className="mb-2">Issue: {assignmentModal.issueTitle}</h4>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Developer Assignment */}
              <div>
                <h4 className="mb-2">👨‍💻 Developer Assignment</h4>
                <div className="mb-2">
                  <strong>Currently Assigned:</strong>
                  <div className="mt-1">
                    {assignmentModal.currentDeveloperName ? (
                      <span className="badge secondary">{assignmentModal.currentDeveloperName}</span>
                    ) : (
                      <span className="badge danger">Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">Assign Developer:</label>
                  <select
                    value={selectedDeveloper}
                    onChange={(e) => setSelectedDeveloper(e.target.value)}
                    className="select w-full"
                  >
                    <option value="">-- No Developer --</option>
                    {developers.map(dev => (
                      <option key={dev.id} value={dev.id}>{dev.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tester Assignment */}
              <div>
                <h4 className="mb-2">🧪 Tester Assignment</h4>
                <div className="mb-2">
                  <strong>Currently Assigned:</strong>
                  <div className="mt-1">
                    {assignmentModal.currentTesterName ? (
                      <span className="badge secondary">{assignmentModal.currentTesterName}</span>
                    ) : (
                      <span className="badge danger">Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">Assign Tester:</label>
                  <select
                    value={selectedTester}
                    onChange={(e) => setSelectedTester(e.target.value)}
                    className="select w-full"
                  >
                    <option value="">-- No Tester --</option>
                    {testers.map(tester => (
                      <option key={tester.id} value={tester.id}>{tester.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap right mt-4">
              <button
                onClick={closeAssignmentModal}
                className="button secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmAssignments}
                className="button primary"
              >
                ✓ Confirm Assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
