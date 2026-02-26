-- Index Optimization for Magna Coders Database
-- Create additional indexes for better query performance

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_lower ON users (lower(username));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_verified ON users (is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users (created_at);

-- Posts table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_id ON posts (author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_category_id ON posts (category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_post_type ON posts (post_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_is_verified ON posts (is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_likes_count ON posts (likes_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_comments_count ON posts (comments_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_views_count ON posts (views_count DESC);

-- Full-text search index for posts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));

-- Tags index (for array operations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_tags ON posts USING gin(tags);

-- Projects table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_client_id ON projects (client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_assigned_to_id ON projects (assigned_to_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_category_id ON projects (category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_budget ON projects (budget);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_deadline ON projects (deadline);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);

-- Comments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id ON comments (post_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author_id ON comments (author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at ON comments (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_likes_count ON comments (likes_count DESC);

-- Replies table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_replies_comment_id ON replies (comment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_replies_author_id ON replies (author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_replies_created_at ON replies (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_replies_likes_count ON replies (likes_count DESC);

-- Bids table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_project_id ON bids (project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_bidder_id ON bids (bidder_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_status ON bids (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_amount ON bids (amount);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_created_at ON bids (created_at DESC);

-- Chat rooms and messages indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_type ON chat_rooms (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_room_members_chat_room_id ON chat_room_members (chat_room_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_room_members_user_id ON chat_room_members (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chat_room_id ON messages (chat_room_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);

-- Follow relationships indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower_id ON follows (follower_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following_id ON follows (following_id);

-- Likes indexes (polymorphic)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_user_id ON likes (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_post_id ON likes (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_comment_id ON likes (comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_reply_id ON likes (reply_id) WHERE reply_id IS NOT NULL;

-- Notifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

-- Reports indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_reporter_id ON reports (reporter_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_reported_user_id ON reports (reported_user_id) WHERE reported_user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_reported_post_id ON reports (reported_post_id) WHERE reported_post_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);

-- Categories indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_name ON categories (name);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_created ON posts (author_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_category_created ON posts (category_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_created ON comments (post_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_room_created ON messages (chat_room_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_project_amount ON bids (project_id, amount ASC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_active ON posts (created_at DESC) WHERE is_verified = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_active ON projects (created_at DESC) WHERE status IN ('OPEN', 'IN_PROGRESS');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications (created_at DESC) WHERE is_read = false;

-- Analyze indexes after creation
ANALYZE;