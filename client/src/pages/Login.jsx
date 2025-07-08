import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { token, user } = await login(form);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            authLogin(user); // Set the user in AuthContext
            navigate('/issues'); // or home page
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className="form">
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" required />
                {error && <p className="error">{error}</p>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
}
