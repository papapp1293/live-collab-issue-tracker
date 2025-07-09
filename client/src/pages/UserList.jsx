import { useEffect, useState } from 'react';
import { fetchUsers } from '../services/api';
import { Link } from 'react-router-dom';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch users');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p">Loading users...</p>;
  if (error) return <p className="alert error">{error}</p>;

  return (
    <div className="container">
      <div className="flex space-between middle mb-3">
        <h2 className="title">All Users</h2>
        <Link to="/" className="button secondary small">
          🏠 Home
        </Link>
      </div>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="card p">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
