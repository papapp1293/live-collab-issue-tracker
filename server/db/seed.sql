-- Insert some default users
INSERT INTO users (email, name, role, password) VALUES
('papapp1293@gmail.com', 'Papapp', 'developer','password'),
('alice@example.com', 'Alice', 'manager','password'),
('bob@example.com', 'Bob', 'developer','password')
ON CONFLICT (email) DO NOTHING;