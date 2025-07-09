import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchIssues, fetchUsers } from '../services/api';

export default function IssueDetail() {
    const { id } = useParams();
    const [issue, setIssue] = useState(null);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchIssues().then((allIssues) => {
            const found = allIssues.find((i) => i.id === parseInt(id));
            if (found) setIssue(found);
            else setError('Issue not found');
        });

        fetchUsers()
            .then(setUsers)
            .catch(() => {
                setError('Failed to load user data');
            });
    }, [id]);

    if (error)
        return (
            <p className="alert error p-3">
                {error}
            </p>
        );
    if (!issue) return <p className="p p-3">Loading...</p>;

    const assignedUser = users.find((u) => u.id === issue.assigned_to);

    return (
        <div className="container p-4">
            <div className="flex space-between middle mb-4">
                <h2 className="header">{issue.title}</h2>
                <Link to="/issues" className="button secondary small" style={{ minWidth: '32px', textAlign: 'center' }}>
                    ✕
                </Link>
            </div>

            <p className="mb-3">
                <strong>Description: </strong> {issue.description}
            </p>
            <p className="mb-3">
                <strong>Status: </strong> {issue.status}
            </p>
            <p className="mb-4">
                <strong>Assigned To: </strong>{' '}
                {assignedUser ? `${assignedUser.name} (${assignedUser.email})` : 'Not Assigned'}
            </p>

            <div className="buttons mt-4">
                <Link to={`/issues/${issue.id}/edit`} className="button primary small mr-2">
                    Edit
                </Link>
                <Link to="/issues" className="button secondary small">
                    Back to Issues
                </Link>
            </div>
        </div>
    );
}
