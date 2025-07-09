import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';
import IssueList from './pages/IssueList';
import CreateIssue from './pages/CreateIssue';
import EditIssue from './pages/EditIssue';
import IssueDetail from './pages/IssueDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function AppLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-6">
      <nav className="mb-6 flex justify-between items-center">
        <div className="space-x-4">
          <Link to="/" className="text-blue-600 hover:underline">Dashboard</Link>
          <Link to="/users" className="text-blue-600 hover:underline">Users</Link>
          <Link to="/issues" className="text-blue-600 hover:underline">Issues</Link>
        </div>
        <div className="flex items-center gap-4">
          <span>{user?.name || user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/issues" element={<IssueList />} />
        <Route path="/issues/create" element={<CreateIssue />} />
        <Route path="/issues/:id/edit" element={<EditIssue />} />
        <Route path="/issues/:id" element={<IssueDetail />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected App Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
