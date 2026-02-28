# Feed System API Integration Guide

This document provides a comprehensive guide to the Feed System APIs for Magna Coders Backend. The feed system supports multiple post types including regular posts, job posts, project posts, and tech news.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Post APIs](#post-apis)
3. [Comments APIs](#comments-apis)
4. [Tags & Categories APIs](#tags--categories-apis)
5. [Jobs APIs](#jobs-apis)
6. [Projects APIs](#projects-apis)
7. [Feed Response Format](#feed-response-format)
8. [Error Handling](#error-handling)
9. [Migration Instructions](#migration-instructions)

---

## Database Schema

### Posts Table
```prisma
model posts {
  id           String       @id @db.Uuid
  title        String       @db.VarChar
  content      String?
  post_type    String       @default("regular") @db.VarChar
  author_id    String       @db.Uuid
  category_id  String?      @db.Uuid
  created_at   DateTime?    @default(dbgenerated("timezone('utc'::text, now())"))
  updated_at   DateTime?    @default(dbgenerated("timezone('utc'::text, now())"))
  post_tags    post_tags[]
  comments     comments[]
  likes        likes[]
  post_media   post_media[]
  author       users        @relation(fields: [author_id])
  categories   categories?  @relation(fields: [category_id])
}
```

### Comments Table (with nested replies support)
```prisma
model comments {
  id         String       @id @db.Uuid
  content    String
  author_id  String       @db.Uuid
  post_id    String       @db.Uuid
  parent_id  String?      @db.Uuid
  created_at DateTime?    @default(dbgenerated("timezone('utc'::text, now())"))
  updated_at DateTime?    @default(dbgenerated("timezone('utc'::text, now())"))
  author     users        @relation(fields: [author_id])
  posts      posts        @relation(fields: [post_id])
  parent     comments?    @relation("CommentReplies", fields: [parent_id])
  replies    comments[]   @relation("CommentReplies")
}
```

### Tags & Post Tags
```prisma
model tags {
  id        String      @id @db.Uuid
  name      String      @unique @db.VarChar
  post_tags post_tags[]
}

model post_tags {
  id      String @id @db.Uuid
  post_id String @db.Uuid
  tag_id  String @db.Uuid
  posts   posts  @relation(fields: [post_id])
  tags    tags   @relation(fields: [tag_id])
}
```

### Opportunities Table (for Job Posts)
```prisma
model opportunities {
  id         String      @id @db.Uuid
  title      String      @db.VarChar
  description String?
  company    String?     @db.VarChar
  location   String?     @db.VarChar
  salary     String?     @db.VarChar
  job_type   String?     @db.VarChar
  deadline   DateTime?   @db.Timestamptz(6)
  author_id  String      @db.Uuid
  category_id String?    @db.Uuid
  created_at DateTime?   @default(dbgenerated("timezone('utc'::text, now())"))
  updated_at DateTime?   @default(dbgenerated("timezone('utc'::text, now())"))
}
```

### Projects Table
```prisma
model projects {
  id              String            @id @db.Uuid
  title           String            @db.VarChar
  description     String?
  owner_id        String            @db.Uuid
  category_id     String?           @db.Uuid
  members_needed  Int?              @default(0)
  deadline        DateTime?         @db.Timestamptz(6)
  created_at      DateTime?         @default(dbgenerated("timezone('utc'::text, now())"))
  updated_at      DateTime?         @default(dbgenerated("timezone('utc'::text, now())"))
}
```

---

## Post APIs

### Get All Feed Posts
```http
GET /api/posts?page=1&limit=10&postType=regular&tags=javascript,react&sortBy=trending
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number for pagination
- `limit` (integer, default: 10) - Number of items per page
- `postType` (string) - Filter by type: `regular`, `job`, `project`, `tech-news`
- `tags` (string) - Comma-separated tag names
- `categoryId` (string) - Filter by category ID
- `authorId` (string) - Filter by author ID
- `sortBy` (string) - Sort option: `trending` or `newest`

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "Post Title",
      "content": "Post content...",
      "post_type": "regular",
      "author_id": "uuid",
      "created_at": "2026-02-14T10:00:00Z",
      "author": {
        "id": "uuid",
        "username": "john_doe",
        "avatar_url": "url"
      },
      "tags": [
        { "id": "uuid", "name": "javascript" },
        { "id": "uuid", "name": "react" }
      ],
      "likesCount": 42,
      "commentsCount": 15,
      "categories": { "id": "uuid", "name": "Technology" }
    }
  ],
  "total": 100,
  "totalPages": 10,
  "currentPage": 1
}
```

### Get Single Post by ID
```http
GET /api/posts/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Post Title",
  "content": "Post content...",
  "post_type": "regular",
  "author_id": "uuid",
  "created_at": "2026-02-14T10:00:00Z",
  "author": {
    "id": "uuid",
    "username": "john_doe",
    "avatar_url": "url"
  },
  "tags": [
    { "id": "uuid", "name": "javascript" }
  ],
  "likesCount": 42,
  "commentsCount": 15,
  "isLiked": true,
  "comments": [
    {
      "id": "uuid",
      "content": "Great post!",
      "author": { "id": "uuid", "username": "jane_doe", "avatar_url": "url" },
      "created_at": "2026-02-14T10:30:00Z",
      "replies": []
    }
  ]
}
```

### Create a New Post
```http
POST /api/posts
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "My First Post",
  "content": "This is my first post",
  "post_type": "regular",
  "tags": ["javascript", "react"],
  "categoryId": "uuid"
}
```

**Response:** `201 Created`

### Like / Unlike a Comment (Reactions)

Toggle a like on a comment (records in DB as a like with `comment_id`).

```http
POST /api/comments/{id}/like
Authorization: Bearer {token}
```

**Response (liked):**
```json
{
  "liked": true,
  "likesCount": 3
}
```

**Response (unliked):**
```json
{
  "liked": false,
  "likesCount": 2
}
```

You can also like replies with:

```http
POST /api/comments/reply/{id}/like
Authorization: Bearer {token}
```

These endpoints create/delete entries in the `likes` table using `comment_id`.

### Update a Post
```http
PUT /api/posts/{id}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["node", "express"]
}
```

**Response:** `200 OK`

### Delete a Post
```http
DELETE /api/posts/{id}
Authorization: Bearer {token}
```

**Response:** `200 OK`

### Like a Post
```http
POST /api/posts/{id}/like
Authorization: Bearer {token}
```

**Response:**
```json
{
  "liked": true,
  "likesCount": 43
}
```

### Unlike a Post
```http
POST /api/posts/{id}/unlike
Authorization: Bearer {token}
```

**Response:**
```json
{
  "liked": false,
  "likesCount": 42
}
```

---

## Comments APIs

### Get All Comments for a Post
```http
GET /api/posts/{id}/comments?page=1&limit=10
```

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "Great post!",
      "author": {
        "id": "uuid",
        "username": "jane_doe",
        "avatar_url": "url"
      },
      "created_at": "2026-02-14T10:30:00Z",
      "replies": [
        {
          "id": "uuid",
          "content": "Thanks!",
          "author": { "id": "uuid", "username": "john_doe", "avatar_url": "url" },
          "created_at": "2026-02-14T10:45:00Z"
        }
      ]
    }
  ],
  "total": 15,
  "totalPages": 2,
  "currentPage": 1
}
```

### Create a Comment
```http
POST /api/posts/{id}/comments
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "content": "Great post!",
  "parentId": null
}
```

**Note:** Use `parentId` to create nested replies to other comments.

**Response:** `201 Created`

### Update a Comment
```http
PUT /api/posts/{id}/comments/{commentId}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "content": "Updated comment"
}
```

**Response:** `200 OK`

### Delete a Comment
```http
DELETE /api/posts/{id}/comments/{commentId}
Authorization: Bearer {token}
```

**Response:** `200 OK`

---

## Tags & Categories APIs

### Get All Tags
```http
GET /api/tags?search=javascript
```

**Response:**
```json
[
  { "id": "uuid", "name": "javascript" },
  { "id": "uuid", "name": "json" }
]
```

### Get Popular Tags
```http
GET /api/tags/popular?limit=10
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "javascript",
    "_count": { "post_tags": 150 }
  }
]
```

### Get All Categories
```http
GET /api/categories
```

**Response:**
```json
[
  { "id": "uuid", "name": "Technology", "description": "Tech related posts" },
  { "id": "uuid", "name": "Opportunities", "description": "Job and project opportunities" }
]
```

---

## Jobs APIs

### Get All Job Posts
```http
GET /api/jobs?page=1&limit=10&jobType=full-time&location=Remote&sortBy=newest
```

**Query Parameters:**
- `page` (integer) - Page number
- `limit` (integer) - Items per page
- `jobType` (string) - Filter by type: `full-time`, `part-time`, `contract`, `internship`
- `location` (string) - Filter by location
- `categoryId` (string) - Filter by category
- `sortBy` (string) - `newest` or `deadline`

**Response:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "title": "Senior React Developer",
      "description": "We are looking for...",
      "company": "Tech Corp",
      "location": "Remote",
      "salary": "$80,000 - $120,000",
      "job_type": "full-time",
      "deadline": "2026-03-14T23:59:59Z",
      "type": "job",
      "author": {
        "id": "uuid",
        "username": "recruiter",
        "avatar_url": "url"
      },
      "deadlineProgress": 75,
      "timeLeft": 28,
      "created_at": "2026-02-14T10:00:00Z"
    }
  ],
  "total": 50,
  "totalPages": 5,
  "currentPage": 1
}
```

### Get Single Job by ID
```http
GET /api/jobs/{id}
```

### Create a Job Post
```http
POST /api/jobs
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Senior React Developer",
  "description": "Job description...",
  "company": "Tech Corp",
  "location": "Remote",
  "salary": "$80,000 - $120,000",
  "jobType": "full-time",
  "deadline": "2026-03-14T23:59:59Z",
  "categoryId": "uuid"
}
```

### Update a Job Post
```http
PUT /api/jobs/{id}
Authorization: Bearer {token}
```

### Delete a Job Post
```http
DELETE /api/jobs/{id}
Authorization: Bearer {token}
```

---

## Projects APIs

### Get All Projects
```http
GET /api/projects?page=1&limit=10&sortby=newest
```

**Query Parameters:**
- `page` (integer) - Page number
- `limit` (integer) - Items per page
- `category` (string) - Filter by category ID
- `sortby` (string) - Sort option: `newest`, `budget_high`, `budget_low`, `deadline`

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "Mobile App Development",
      "description": "Build a mobile app for...",
      "type": "project",
      "owner": {
        "id": "uuid",
        "username": "project_owner",
        "avatar_url": "url"
      },
      "members_needed": 3,
      "deadline": "2026-04-14T23:59:59Z",
      "membersJoined": 2,
      "deadlineProgress": 65,
      "timeLeft": 59,
      "created_at": "2026-02-14T10:00:00Z"
    }
  ],
  "previous": null,
  "next": "?page=2"
}
```

### Get Single Project by ID
```http
GET /api/projects/{id}
```

### Create a Project
```http
POST /api/projects
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Mobile App Development",
  "description": "Build a mobile app for...",
  "categoryId": "uuid",
  "membersNeeded": 3,
  "deadline": "2026-04-14T23:59:59Z"
}
```

### Update a Project
```http
PUT /api/projects/{id}
Authorization: Bearer {token}
```

### Delete a Project
```http
DELETE /api/projects/{id}
Authorization: Bearer {token}
```

---

## Feed Response Format

Each feed item should have the following structure:

### Regular Post
```json
{
  "id": "uuid",
  "type": "post",
  "title": "Post Title",
  "content": "Post content...",
  "author": {
    "id": "uuid",
    "username": "john_doe",
    "avatar_url": "url",
    "role": "developer"
  },
  "created_at": "2026-02-14T10:00:00Z",
  "likes": 42,
  "comments": 15,
  "tags": [
    { "id": "uuid", "name": "javascript" },
    { "id": "uuid", "name": "react" }
  ]
}
```

### Job Post
```json
{
  "id": "uuid",
  "type": "job",
  "title": "Senior React Developer",
  "company": "Tech Corp",
  "description": "Job description...",
  "location": "Remote",
  "salary": "$80,000 - $120,000",
  "tags": ["react", "javascript"],
  "jobType": "full-time",
  "deadlineProgress": 75,
  "timeLeft": 28,
  "author": {
    "id": "uuid",
    "username": "recruiter",
    "avatar_url": "url"
  },
  "created_at": "2026-02-14T10:00:00Z"
}
```

### Project Post
```json
{
  "id": "uuid",
  "type": "project",
  "title": "Mobile App Development",
  "description": "Build a mobile app for...",
  "tags": ["react-native", "firebase"],
  "membersNeeded": 3,
  "membersJoined": 2,
  "requestsSent": 5,
  "deadlineProgress": 65,
  "timeLeft": 59,
  "author": {
    "id": "uuid",
    "username": "project_owner",
    "avatar_url": "url"
  },
  "created_at": "2026-02-14T10:00:00Z"
}
```

### Comment Structure
```json
{
  "id": "uuid",
  "author": {
    "id": "uuid",
    "username": "jane_doe",
    "avatar_url": "url"
  },
  "content": "Great post!",
  "created_at": "2026-02-14T10:30:00Z",
  "timestamp": 1707900600000,
  "likes": 5,
  "isLiked": false,
  "isOwner": false,
  "replies": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "username": "john_doe",
        "avatar_url": "url"
      },
      "content": "Thanks!",
      "created_at": "2026-02-14T10:45:00Z"
    }
  ]
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "message": "Title is required"
}
```

**401 Unauthorized**
```json
{
  "message": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "message": "Access denied"
}
```

**404 Not Found**
```json
{
  "message": "Post not found"
}
```

**500 Server Error**
```json
{
  "message": "Internal server error"
}
```

---

## Migration Instructions

### Step 1: Update Prisma Schema
The schema has already been updated with:
- `post_type` field in posts table
- `parent_id` field in comments for nested replies
- `tags` and `post_tags` tables for tag management
- Extended `opportunities` table for job details
- Extended `projects` table with `members_needed` and `deadline`

### Step 2: Run Prisma Migration
```bash
npx prisma migrate dev --name add_feed_features
```

This will:
1. Create the migration files
2. Apply the changes to your database
3. Regenerate Prisma Client

### Step 3: Verify Controllers & Routes
All controllers have been created/updated:
- `/src/controllers/posts/post.ts` - Enhanced with tag and type support
- `/src/controllers/comments/index.ts` - New comment controller
- `/src/controllers/tags/index.ts` - New tags controller
- `/src/controllers/jobs/index.ts` - New jobs controller
- `/src/controllers/projects/index.ts` - Updated with deadline features

Routes have been created:
- `/src/routes/posts.ts` - Updated with new endpoints
- `/src/routes/jobs.ts` - New jobs routes
- `/src/routes/index.ts` - Updated to include jobs route

### Step 4: Testing the APIs

Use the provided endpoints to test:

```bash
# Get all feed posts
curl "http://localhost:3000/api/posts?page=1&limit=10"

# Create a post
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Post",
    "content": "Content",
    "post_type": "regular",
    "tags": ["javascript"]
  }'

# Get comments for a post
curl "http://localhost:3000/api/posts/{postId}/comments"

# Create a job post
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Developer Needed",
    "company": "My Company",
    "location": "Remote",
    "jobType": "full-time"
  }'
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Post types supported: `regular`, `job`, `project`, `tech-news`
- Comments support nested replies using `parentId` field
- Tags are automatically created if they don't exist
- Pagination starts at page 1
- For deadline calculations:
  - `deadlineProgress`: Percentage of time elapsed (0-100)
  - `timeLeft`: Days remaining until deadline

---

## File Structure

```
src/
├── controllers/
│   ├── comments/          # Comment management
│   ├── jobs/              # Job post management  
│   ├── projects/          # Enhanced project management
│   ├── tags/              # Tags & categories
│   └── posts/
│       └── post.ts        # Enhanced post controller
├── routes/
│   ├── jobs.ts            # New job routes
│   ├── posts.ts           # Enhanced post routes
│   └── index.ts           # Route aggregation
└── prisma/
    └── schema.prisma      # Updated database schema
```

---

For more information and API documentation, refer to the Swagger/OpenAPI documentation available at `/api/docs`.
