import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserList from './pages/UserList';
import IssueList from './pages/IssueList';
import CreateIssue from './pages/CreateIssue';
import EditIssue from './pages/EditIssue';
import IssueDetail from './pages/IssueDetail';

function App() {
  return (
    <Router>
      <div className="p-6">
        <nav className="mb-6 space-x-4">
          <Link to="/users" className="text-blue-600 hover:underline">Users</Link>
          <Link to="/issues" className="text-blue-600 hover:underline">Issues</Link>
        </nav>

        <Routes>
          <Route path="/users" element={<UserList />} />
          <Route path="/issues" element={<IssueList />} />
          <Route path="/issues/create" element={<CreateIssue />} />
          <Route path="/issues/:id/edit" element={<EditIssue />} />
          <Route path="/issues/:id" element={<IssueDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
