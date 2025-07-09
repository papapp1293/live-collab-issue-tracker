-- Not used
-- User creation is replaced by seedUsers.js

-- Insert some default users
INSERT INTO users (email, name, role, password) VALUES
('papapp1293@gmail.com', 'Papapp', 'developer','password'),
('alice@example.com', 'Alice', 'manager','password'),
('bob@example.com', 'Bob', 'developer','password')
ON CONFLICT (email) DO NOTHING;

-- Insert sample issues for testing AI summary generation
INSERT INTO issues (title, description, assigned_to, status) VALUES
('Login Authentication Bug', 'Users are unable to login using their email and password. The system returns an error message "Invalid credentials" even when correct credentials are provided. This affects all users and appears to be related to the recent authentication middleware update.', 1, 'open'),
('Implement Dark Mode Feature', 'Add a dark mode toggle to the user interface. This should include updating the CSS variables, adding a theme switcher in the header, and persisting the user preference in localStorage. The dark mode should apply to all pages including the dashboard, issue list, and forms.', 2, 'in_progress'),
('Database Performance Issue', 'The issues list page is loading very slowly when there are more than 100 issues in the database. The query to fetch all issues with user joins is taking over 5 seconds. We need to optimize the database queries and possibly add pagination to improve performance.', 1, 'open'),
('Mobile Responsive Design', 'The application does not display properly on mobile devices. The navigation menu overlaps with content, buttons are too small to tap, and forms extend beyond the screen width. We need to implement responsive CSS using media queries to ensure the app works well on phones and tablets.', 3, 'open'),
('Real-time Notifications System', 'Implement a notification system that alerts users when they are assigned new issues or when issues they created are updated. This should use WebSocket connections to provide real-time updates without requiring page refreshes. Include both in-app notifications and optional email notifications.', 2, 'open');