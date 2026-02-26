-- Magna Coders Database Seed Data
-- Sample data for development and testing

-- Insert sample users
INSERT INTO users (id, email, name, password_hash) VALUES
    (uuid_generate_v4(), 'admin@magna-coders.com', 'Admin User', '$2b$10$example.hash.for.password123'),
    (uuid_generate_v4(), 'john.doe@example.com', 'John Doe', '$2b$10$example.hash.for.password123'),
    (uuid_generate_v4(), 'jane.smith@example.com', 'Jane Smith', '$2b$10$example.hash.for.password123');

-- Insert sample posts
INSERT INTO posts (title, content, published, author_id) VALUES
    (
        'Welcome to Magna Coders',
        'This is the first post on our platform. Welcome to the community of amazing developers!',
        true,
        (SELECT id FROM users WHERE email = 'admin@magna-coders.com')
    ),
    (
        'Getting Started with Full-Stack Development',
        'Learn the basics of full-stack development with React, Node.js, and PostgreSQL.',
        true,
        (SELECT id FROM users WHERE email = 'john.doe@example.com')
    ),
    (
        'Draft: Advanced TypeScript Tips',
        'This post contains advanced TypeScript tips and tricks for better development.',
        false,
        (SELECT id FROM users WHERE email = 'jane.smith@example.com')
    );

-- Display inserted data
SELECT 'Users created:' as info;
SELECT id, email, name, created_at FROM users;

SELECT 'Posts created:' as info;
SELECT p.id, p.title, p.published, u.name as author, p.created_at 
FROM posts p 
JOIN users u ON p.author_id = u.id;