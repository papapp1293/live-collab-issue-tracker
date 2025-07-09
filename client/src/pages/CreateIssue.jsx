import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchUsers, createIssue } from '../services/api';

export default function CreateIssue() {
  const navigate = useNavigate();

  const [issue, setIssue] = useState({
    title: '',
    description: '',
    assigned_to: '',
    status: 'open',
  });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users'));
  }, []);

  const handleChange = (e) => {
    setIssue({ ...issue, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createIssue({
        title: issue.title,
        description: issue.description,
        assigned_to: issue.assigned_to ? parseInt(issue.assigned_to) : null,
      });
      navigate('/issues');
    } catch (err) {
      console.error(err);
      setError('Failed to create issue');
    }
  };

  if (error) return <p className="alert error">{error}</p>;

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className="flex space-between middle mb-3">
        <h2 className="title">Create New Issue</h2>
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

        <label htmlFor="assigned_to">Assign To</label>
        <select
          id="assigned_to"
          name="assigned_to"
          value={issue.assigned_to}
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
          Create Issue
        </button>
      </form>
    </div>
  );
}
