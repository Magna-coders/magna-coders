-- ===========================================================
-- MAGNA CODERS APP — DATABASE SCHEMA (V1.0)
-- PostgreSQL 16+ | Compatible with Supabase
-- ===========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================================
-- 1 USERS & PROFILES
-- ===========================================================
CREATE TABLE public.users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR NOT NULL UNIQUE,
  email VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  availability VARCHAR DEFAULT 'available' CHECK (availability IN ('available','busy','unavailable')),
  profile_complete_percentage INT DEFAULT 0,
  avatar_url TEXT,
  location TEXT,
  bio TEXT,
  website_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  whatsapp_url TEXT
);

-- ===========================================================
-- 2 USER METADATA TABLES
-- ===========================================================
CREATE TABLE public.user_roles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  role_name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE public.user_categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  category_name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE public.user_skills (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  skill_name VARCHAR NOT NULL,
  proficiency_level VARCHAR DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner','intermediate','advanced','expert')),
  availability VARCHAR DEFAULT 'available' CHECK (availability IN ('available','busy','unavailable')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ===========================================================
-- 3 SOCIAL GRAPH (FRIENDS / REQUESTS)
-- ===========================================================
CREATE TABLE public.friend_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE public.friends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  connected_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ===========================================================
-- 4 CONVERSATIONS & MESSAGING
-- ===========================================================
CREATE TABLE public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct','group')),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.conversation_members (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================================
-- 5 TAGS (TECH STACK / CATEGORY LABELS)
-- ===========================================================
CREATE TABLE public.tags (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE
);

-- ===========================================================
-- 6 POSTS & MEDIA (MAIN FEED)
-- ===========================================================
CREATE TABLE public.posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('text','project','reel','photo','design','opportunity')),
  title TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','private')),
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0
);

CREATE TABLE public.post_media (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  media_type TEXT CHECK (media_type IN ('image','video','file')),
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE public.post_tags (
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE public.comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE public.likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ===========================================================
-- 7 PROJECTS & COLLABORATION
-- ===========================================================
CREATE TABLE public.projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE public.project_members (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT,
  joined_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  PRIMARY KEY (project_id, user_id)
);

-- ===========================================================
-- 8 OPPORTUNITIES (BUSINESS POSTS)
-- ===========================================================
CREATE TABLE public.opportunities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT,
  contact_email TEXT,
  location TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ===========================================================
-- 9 REELS (VIDEO CONTENT)
-- ===========================================================
CREATE TABLE public.reels (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  views INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ===========================================================
-- 10 NOTIFICATIONS & EVENTS
-- ===========================================================
CREATE TABLE public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('invite','mention','system','friend_request')),
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE public.events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- ===========================================================
-- 11 SECURITY UTILITIES
-- ===========================================================
-- Example usage of pgcrypto for encrypted user emails
-- (optional if you wish to use encryption later)
-- UPDATE users SET email = pgp_sym_encrypt(email, 'secret_key');

-- ===========================================================
-- END OF SCHEMA
-- ===========================================================
