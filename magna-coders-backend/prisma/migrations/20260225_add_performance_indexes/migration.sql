-- Migration: Add performance indexes for AI backend integration
-- This migration adds indexes to frequently queried fields to ensure 99% of queries complete within 500ms

-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add index on user_skills.user_id for faster user skill lookups
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);

-- Add index on user_roles.user_id for faster user role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Add index on projects.owner_id for faster user project lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

-- Add index on projects.status for filtering by status
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Add composite index on posts for text search optimization
-- This helps with the community posts search query
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm ON posts USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING gin(content gin_trgm_ops);

-- Add index on posts.created_at for ordering
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Add index on opportunities for job matching queries
CREATE INDEX IF NOT EXISTS idx_opportunities_job_type ON opportunities(job_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_location ON opportunities(location);

-- Add composite index on user_skills for skill-based queries
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);

-- Add index on post_tags for tag-based queries
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

