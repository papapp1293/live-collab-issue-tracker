import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserList from './pages/UserList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="p-6">
        <nav className="mb-6 space-x-4">
          <Link to="/users" className="text-blue-600 hover:underline">Users</Link>
          {/* You can add more links like: <Link to="/issues">Issues</Link> */}
        </nav>

        <Routes>
          <Route path="/users" element={<UserList />} />
          <Route path="*" element={<div>Welcome! Choose a route.</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
