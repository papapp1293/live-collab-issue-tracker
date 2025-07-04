import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUsers, fetchIssues, updateIssue } from '../services/api';

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
        console.log("Submitting updated issue:", {
            title: issue.title,
            description: issue.description,
            assigned_to: parseInt(issue.assigned_to) || null,
            status: issue.status,
        });
        try {
            await updateIssue(id, {
                title: issue.title,
                description: issue.description,
                assigned_to: parseInt(issue.assigned_to) || null,
                status: issue.status,
            });
            navigate('/issues');
        } catch (err) {
            console.error(err);
            setError('Failed to update issue');
        }
    };

    if (error) return <p className="text-red-500 p-4">{error}</p>;
    if (!issue) return <p className="p-4">Loading...</p>;

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Issue</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-semibold">Title</label>
                    <input
                        type="text"
                        name="title"
                        className="w-full border p-2 rounded"
                        value={issue.title}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block font-semibold">Description</label>
                    <textarea
                        name="description"
                        className="w-full border p-2 rounded"
                        value={issue.description}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block font-semibold">Status</label>
                    <select
                        name="status"
                        className="w-full border p-2 rounded"
                        value={issue.status}
                        onChange={handleChange}
                    >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <div>
                    <label className="block font-semibold">Assign To</label>
                    <select
                        name="assigned_to"
                        className="w-full border p-2 rounded"
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
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Update Issue
                </button>
            </form>
        </div>
    );
}
