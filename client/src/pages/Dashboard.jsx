import { useEffect, useState } from 'react';
import { fetchMyIssues } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ManagerDashboard from './ManagerDashboard';
import socketService from '../services/socket';

export default function Dashboard() {
    const { user } = useAuth();

    // Route managers to their specialized dashboard
    if (user?.role === 'manager') {
        return <ManagerDashboard />;
    }

    const [myIssues, setMyIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyIssues()
            .then(data => {
                if (Array.isArray(data)) {
                    setMyIssues(data);
                } else {
                    setMyIssues([]);
                    setError('Invalid data received from server');
                }
            })
            .catch((err) => {
                setMyIssues([]);
                setError(err.message || 'Failed to fetch your issues');
            })
            .finally(() => setLoading(false));

        // Set up Socket.IO listeners for real-time updates to user's issues
        socketService.onIssueCreated((newIssue) => {
            // Only add if the issue is assigned to current user (as developer or tester)
            if (newIssue.assigned_developer === user?.id || newIssue.assigned_tester === user?.id) {
                setMyIssues(prevIssues => [newIssue, ...prevIssues]);
            }
        });

        socketService.onIssueUpdated((updatedIssue) => {
            setMyIssues(prevIssues => {
                const existingIndex = prevIssues.findIndex(issue => issue.id === updatedIssue.id);
                const isAssignedToUser = updatedIssue.assigned_developer === user?.id || updatedIssue.assigned_tester === user?.id;

                // If issue was already in user's list
                if (existingIndex !== -1) {
                    // If it's still assigned to user, update it
                    if (isAssignedToUser) {
                        return prevIssues.map(issue =>
                            issue.id === updatedIssue.id ? { ...issue, ...updatedIssue } : issue
                        );
                    } else {
                        // If it's no longer assigned to user, remove it
                        return prevIssues.filter(issue => issue.id !== updatedIssue.id);
                    }
                } else {
                    // If issue wasn't in user's list but is now assigned to them, add it
                    if (isAssignedToUser) {
                        return [updatedIssue, ...prevIssues];
                    }
                    // Otherwise, ignore the update (not relevant to user)
                    return prevIssues;
                }
            });
        });

        socketService.onIssueDeleted((deletedIssue) => {
            setMyIssues(prevIssues =>
                prevIssues.filter(issue => issue.id !== deletedIssue.id)
            );
        });

        // Cleanup listeners on unmount
        return () => {
            socketService.removeListener('issue:created');
            socketService.removeListener('issue:updated');
            socketService.removeListener('issue:deleted');
        };
    }, [user?.id]);

    if (loading) return <p className="p">Loading your dashboard...</p>;

    return (
        <div className="container">
            <h1 className="title mb-3">Developer Dashboard</h1>
            <p className="text-muted mb-4">Welcome back, {user?.name || user?.email}!</p>

            <div className="flex gap mb-4">
                <Link to="/users" className="button secondary small">
                    👥 View All Users
                </Link>
                <Link to="/issues" className="button secondary small">
                    📋 View All Issues
                </Link>
                <Link to="/issues/create" className="button primary small">
                    + Create New Issue
                </Link>
            </div>

            <section>
                <h2 className="title mb-3">My Assigned Issues ({myIssues.length})</h2>

                {error && <p className="alert error">{error}</p>}

                {myIssues.length === 0 ? (
                    <div className="card p text-center">
                        <p className="text-muted">🎉 No issues assigned to you at the moment!</p>
                        <p className="text-muted mt-2">You can view all issues or create a new one using the buttons above.</p>
                    </div>
                ) : (
                    <ul>
                        {myIssues.map((issue) => (
                            <li
                                key={issue.id}
                                className="card card-hover flex middle gap"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/issues/${issue.id}`)}
                            >
                                <div className="flex-grow">
                                    <h3>{issue.title}</h3>

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
                                        <span className="badge success">
                                            Assigned to me as {user?.role}
                                        </span>
                                        {issue.assigned_developer_name && user?.role !== 'developer' && (
                                            <span className="badge secondary">
                                                Dev: {issue.assigned_developer_name}
                                            </span>
                                        )}
                                        {issue.assigned_tester_name && user?.role !== 'tester' && (
                                            <span className="badge secondary">
                                                Test: {issue.assigned_tester_name}
                                            </span>
                                        )}
                                        <span className="badge secondary text-sm">
                                            Created: {new Date(issue.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap">
                                    <Link
                                        to={`/issues/${issue.id}/edit`}
                                        className="button secondary small"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="mt-6">
                <h2 className="title mb-3">Quick Stats</h2>
                <div className="flex gap">
                    <div className="card p text-center">
                        <h3 className="mb-1">{myIssues.length}</h3>
                        <p className="text-muted">Total Assigned</p>
                    </div>
                    <div className="card p text-center">
                        <h3 className="mb-1">{myIssues.filter(issue => issue.status === 'open').length}</h3>
                        <p className="text-muted">Open</p>
                    </div>
                    <div className="card p text-center">
                        <h3 className="mb-1">{myIssues.filter(issue => issue.status === 'in_progress').length}</h3>
                        <p className="text-muted">In Progress</p>
                    </div>
                    <div className="card p text-center">
                        <h3 className="mb-1">{myIssues.filter(issue => issue.status === 'resolved').length}</h3>
                        <p className="text-muted">Resolved</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
