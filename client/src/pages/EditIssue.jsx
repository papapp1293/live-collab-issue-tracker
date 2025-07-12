import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchIssues, updateIssue, fetchUsersByRole } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';

export default function EditIssue() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [issue, setIssue] = useState(null);
    const [developers, setDevelopers] = useState([]);
    const [testers, setTesters] = useState([]);
    const [error, setError] = useState(null);

    const isManager = user?.role === 'manager';

    useEffect(() => {
        fetchIssues().then((issues) => {
            const found = issues.find((i) => i.id === parseInt(id));
            if (found) setIssue(found);
            else setError('Issue not found');
        });

        fetchUsersByRole('developer', 'EditIssue').then(setDevelopers).catch(() => {
            if (isManager) setError('Failed to load developers');
        });
        fetchUsersByRole('tester', 'EditIssue').then(setTesters).catch(() => {
            if (isManager) setError('Failed to load testers');
        });
    }, [id, isManager]);

    const handleChange = (e) => {
        setIssue({ ...issue, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updateData = {
                title: issue.title,
                description: issue.description,
                status: issue.status,
            };

            // Only include assignment fields if user is a manager
            if (isManager) {
                updateData.assigned_developer = parseInt(issue.assigned_developer) || null;
                updateData.assigned_tester = parseInt(issue.assigned_tester) || null;
            }

            const updatedIssue = await updateIssue(id, updateData);

            // Emit Socket event for real-time updates
            socketService.emitIssueUpdated({ ...updatedIssue, id: parseInt(id) });

            navigate(`/issues/${id}`);
        } catch (err) {
            console.error(err);
            setError('Failed to update issue');
        }
    };

    if (error) return <p className="alert error">{error}</p>;
    if (!issue) return <p className="p">Loading...</p>;

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div className="flex space-between middle mb-3">
                <h2 className="title">Edit Issue</h2>
                <Link to="/issues" className="button secondary small" style={{ minWidth: '32px', textAlign: 'center' }}>
                    ✕
                </Link>
            </div>
            <form onSubmit={handleSubmit} className="form stacked">
                <label htmlFor="title">Title</label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    value={issue.title}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={issue.description}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="status">Status</label>
                <select
                    id="status"
                    name="status"
                    value={issue.status}
                    onChange={handleChange}
                    required
                >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                </select>

                <label htmlFor="assigned_developer">Assign Developer</label>
                <select
                    id="assigned_developer"
                    name="assigned_developer"
                    value={issue.assigned_developer || ''}
                    onChange={handleChange}
                    disabled={!isManager}
                >
                    <option value="">No Developer Assigned</option>
                    {developers.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
                {!isManager && <small className="text-muted">Only managers can assign developers</small>}

                <label htmlFor="assigned_tester">Assign Tester</label>
                <select
                    id="assigned_tester"
                    name="assigned_tester"
                    value={issue.assigned_tester || ''}
                    onChange={handleChange}
                    disabled={!isManager}
                >
                    <option value="">No Tester Assigned</option>
                    {testers.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
                {!isManager && <small className="text-muted">Only managers can assign testers</small>}

                <div className="mt-3">
                    <button type="submit" className="button primary">
                        Update Issue
                    </button>
                </div>
            </form>
        </div>
    );
}
