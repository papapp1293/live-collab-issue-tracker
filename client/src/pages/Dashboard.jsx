import { useEffect, useState } from 'react';
import { fetchMyIssues } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const [myIssues, setMyIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
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
    }, []);

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
                                    <p className="text-muted">{issue.description}</p>
                                    <div className="flex gap wrap mt-1">
                                        <span className="badge primary" style={{ textTransform: 'capitalize' }}>
                                            {issue.status.replace('_', ' ')}
                                        </span>
                                        <span className="badge success">
                                            Assigned to me
                                        </span>
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
