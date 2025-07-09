import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUsers, fetchIssues, updateIssue } from '../services/api';
import socketService from '../services/socket';

export default function EditIssue() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [issue, setIssue] = useState(null);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchIssues().then((issues) => {
            const found = issues.find((i) => i.id === parseInt(id));
            if (found) setIssue(found);
            else setError('Issue not found');
        });

        fetchUsers().then(setUsers).catch(() => setError('Failed to load users'));
    }, [id]);

    const handleChange = (e) => {
        setIssue({ ...issue, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedIssue = await updateIssue(id, {
                title: issue.title,
                description: issue.description,
                assigned_to: parseInt(issue.assigned_to) || null,
                status: issue.status,
            });

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

                <label htmlFor="assigned_to">Assign To</label>
                <select
                    id="assigned_to"
                    name="assigned_to"
                    value={issue.assigned_to || ''}
                    onChange={handleChange}
                >
                    <option value="">Not Assigned</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>

                <button type="submit" className="button primary mt-3">
                    Update Issue
                </button>
            </form>
        </div>
    );
}
