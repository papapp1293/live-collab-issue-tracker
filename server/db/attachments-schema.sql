-- server/db/attachments-schema.sql
CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL,
    comment_id INTEGER, -- Can be NULL if attached directly to an issue
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);
