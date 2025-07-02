-- Insert some default users
INSERT INTO users (email, name, role) VALUES
('papapp1293@gmail.com', 'Papapp', 'developer'),
('alice@example.com', 'Alice', 'manager'),
('bob@example.com', 'Bob', 'developer')
ON CONFLICT (email) DO NOTHING;