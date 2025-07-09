import { useEffect, useState } from 'react';
import { fetchIssues } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ManagerDashboard() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [developers, setDevelopers] = useState([]);
    const [testers, setTesters] = useState([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        // Fetch issues for manager view
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

        // Fetch developers and testers for assignment dropdowns
        fetchUsersByRole('developer').then(setDevelopers).catch(console.error);
        fetchUsersByRole('tester').then(setTesters).catch(console.error);
    }, []);

    const fetchUsersByRole = async (role) => {
        try {
            const response = await fetch(`/api/issues/users/${role}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (err) {
            console.error(`Error fetching ${role}s:`, err);
            return [];
        }
    };

    const assignDeveloper = async (issueId, developerId) => {
        try {
            const response = await fetch(`/api/issues/${issueId}/assign-developer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ developerId })
            });

            if (response.ok) {
                // Refresh issues
                const updatedIssues = await fetchIssues();
                setIssues(updatedIssues);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to assign developer');
            }
        } catch (err) {
            console.error('Error assigning developer:', err);
            alert('Failed to assign developer');
        }
    };

    const assignTester = async (issueId, testerId) => {
        try {
            const response = await fetch(`/api/issues/${issueId}/assign-tester`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ testerId })
            });

            if (response.ok) {
                // Refresh issues
                const updatedIssues = await fetchIssues();
                setIssues(updatedIssues);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to assign tester');
            }
        } catch (err) {
            console.error('Error assigning tester:', err);
            alert('Failed to assign tester');
        }
    };

    const getAssignmentStatusBadge = (issue) => {
        const hasDevAssignment = issue.assigned_developer;
        const hasTestAssignment = issue.assigned_tester;

        if (!hasDevAssignment && !hasTestAssignment) {
            return <span className="badge danger small">Unassigned</span>;
        } else if (!hasDevAssignment) {
            return <span className="badge warning small">Needs Developer</span>;
        } else if (!hasTestAssignment) {
            return <span className="badge warning small">Needs Tester</span>;
        } else {
            return <span className="badge success small">Fully Assigned</span>;
        }
    };

    if (loading) return <p className="p">Loading dashboard...</p>;
    if (error) return <p className="alert error">{error}</p>;

    // Categorize issues by priority
    const unassignedIssues = issues.filter(issue => !issue.assigned_developer && !issue.assigned_tester);
    const partiallyAssignedIssues = issues.filter(issue =>
        (issue.assigned_developer && !issue.assigned_tester) ||
        (!issue.assigned_developer && issue.assigned_tester)
    );
    const fullyAssignedIssues = issues.filter(issue => issue.assigned_developer && issue.assigned_tester);

    return (
        <div className="container">
            <div className="flex space-between middle mb-4">
                <div>
                    <h1 className="title">Manager Dashboard</h1>
                    <p className="text-muted">Welcome back, {user?.name}! Manage issue assignments and track progress.</p>
                </div>
                <div className="flex gap">
                    <Link to="/issues" className="button secondary small">
                        📋 All Issues
                    </Link>
                    <Link to="/issues/create" className="button primary small">
                        + New Issue
                    </Link>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card p text-center">
                    <h3 className="text-danger">{unassignedIssues.length}</h3>
                    <p className="text-muted">Unassigned Issues</p>
                </div>
                <div className="card p text-center">
                    <h3 className="text-warning">{partiallyAssignedIssues.length}</h3>
                    <p className="text-muted">Partially Assigned</p>
                </div>
                <div className="card p text-center">
                    <h3 className="text-success">{fullyAssignedIssues.length}</h3>
                    <p className="text-muted">Fully Assigned</p>
                </div>
                <div className="card p text-center">
                    <h3>{issues.length}</h3>
                    <p className="text-muted">Total Issues</p>
                </div>
            </div>

            {/* Priority Issues Section */}
            {unassignedIssues.length > 0 && (
                <div className="mb-4">
                    <h2>🚨 Unassigned Issues</h2>
                    <div className="card">
                        {unassignedIssues.map(issue => (
                            <div key={issue.id} className="p border-bottom">
                                <div className="flex space-between middle">
                                    <div className="flex-grow">
                                        <h4>{issue.title}</h4>
                                        {issue.ai_summary ? (
                                            <div className="alert success mt-1 mb-2" style={{ padding: '6px 10px' }}>
                                                <strong>🤖 AI Summary:</strong> {issue.ai_summary}
                                            </div>
                                        ) : (
                                            <p className="text-muted">{issue.description}</p>
                                        )}
                                        {getAssignmentStatusBadge(issue)}
                                    </div>
                                    <div className="flex gap">
                                        <select
                                            onChange={(e) => e.target.value && assignDeveloper(issue.id, e.target.value)}
                                            defaultValue=""
                                            className="select small"
                                        >
                                            <option value="">Assign Developer</option>
                                            {developers.map(dev => (
                                                <option key={dev.id} value={dev.id}>{dev.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            onChange={(e) => e.target.value && assignTester(issue.id, e.target.value)}
                                            defaultValue=""
                                            className="select small"
                                        >
                                            <option value="">Assign Tester</option>
                                            {testers.map(tester => (
                                                <option key={tester.id} value={tester.id}>{tester.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => navigate(`/issues/${issue.id}`)}
                                            className="button secondary small"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Partially Assigned Issues */}
            {partiallyAssignedIssues.length > 0 && (
                <div className="mb-4">
                    <h2>⚠️ Partially Assigned Issues</h2>
                    <div className="card">
                        {partiallyAssignedIssues.map(issue => (
                            <div key={issue.id} className="p border-bottom">
                                <div className="flex space-between middle">
                                    <div className="flex-grow">
                                        <h4>{issue.title}</h4>
                                        {issue.ai_summary ? (
                                            <div className="alert success mt-1 mb-2" style={{ padding: '6px 10px' }}>
                                                <strong>🤖 AI Summary:</strong> {issue.ai_summary}
                                            </div>
                                        ) : (
                                            <p className="text-muted">{issue.description}</p>
                                        )}
                                        <div className="flex gap wrap mt-1">
                                            {getAssignmentStatusBadge(issue)}
                                            {issue.assigned_developer_name && (
                                                <span className="badge secondary small">Dev: {issue.assigned_developer_name}</span>
                                            )}
                                            {issue.assigned_tester_name && (
                                                <span className="badge secondary small">Test: {issue.assigned_tester_name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap">
                                        {!issue.assigned_developer && (
                                            <select
                                                onChange={(e) => e.target.value && assignDeveloper(issue.id, e.target.value)}
                                                defaultValue=""
                                                className="select small"
                                            >
                                                <option value="">Assign Developer</option>
                                                {developers.map(dev => (
                                                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        {!issue.assigned_tester && (
                                            <select
                                                onChange={(e) => e.target.value && assignTester(issue.id, e.target.value)}
                                                defaultValue=""
                                                className="select small"
                                            >
                                                <option value="">Assign Tester</option>
                                                {testers.map(tester => (
                                                    <option key={tester.id} value={tester.id}>{tester.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        <button
                                            onClick={() => navigate(`/issues/${issue.id}`)}
                                            className="button secondary small"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Issues Quick View */}
            <div>
                <h2>📋 All Issues Overview</h2>
                <div className="card">
                    {issues.length === 0 ? (
                        <p className="text-muted p">No issues found. Create one above.</p>
                    ) : (
                        <div>
                            {issues.slice(0, 10).map(issue => (
                                <div key={issue.id} className="p border-bottom flex space-between middle">
                                    <div className="flex-grow">
                                        <h4>{issue.title}</h4>
                                        <div className="flex gap wrap">
                                            <span className="badge primary small" style={{ textTransform: 'capitalize' }}>
                                                {issue.status.replace('_', ' ')}
                                            </span>
                                            {getAssignmentStatusBadge(issue)}
                                            {issue.assigned_developer_name && (
                                                <span className="badge secondary small">Dev: {issue.assigned_developer_name}</span>
                                            )}
                                            {issue.assigned_tester_name && (
                                                <span className="badge secondary small">Test: {issue.assigned_tester_name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/issues/${issue.id}`)}
                                        className="button secondary small"
                                    >
                                        View
                                    </button>
                                </div>
                            ))}
                            {issues.length > 10 && (
                                <div className="p text-center">
                                    <Link to="/issues" className="button secondary small">
                                        View All {issues.length} Issues
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
