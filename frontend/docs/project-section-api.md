# Project Section API Endpoints

This document details all endpoints required for the project section, including request and response structures.

---

## 1. Create Project

- **Endpoint:** `POST /api/projects`
- **Request Body:**
  - `name` (string, required)
  - `description` (string, optional)
  - `tags` (array of strings, optional)
  - `visibility` (enum: "public" | "private", required)
  - `ownerId` (string, required)
  - `members` (array of user IDs, optional)
- **Response:**
  - `id` (string)
  - `name` (string)
  - `description` (string)
  - `tags` (array of strings)
  - `visibility` (string)
  - `ownerId` (string)
  - `members` (array of user objects)
  - `createdAt` (ISO date string)
  - `updatedAt` (ISO date string)

---

## 2. Get All Projects

- **Endpoint:** `GET /api/projects`
- **Query Params:**
  - `ownerId` (string, optional)
  - `memberId` (string, optional)
  - `visibility` (string, optional)
  - `search` (string, optional)
  - `limit` (number, optional)
  - `offset` (number, optional)
- **Response:**
  - `projects` (array of project objects)
  - `total` (number)

---

## 3. Get Single Project

- **Endpoint:** `GET /api/projects/:projectId`
- **Response:**
  - Full project object
  - Optionally, related entities (tasks, files, etc.)

---

## 4. Update Project

- **Endpoint:** `PUT /api/projects/:projectId`
- **Request Body:**
  - `name` (string, optional)
  - `description` (string, optional)
  - `tags` (array of strings, optional)
  - `visibility` (string, optional)
  - `members` (array of user IDs, optional)
- **Response:**
  - Updated project object

---

## 5. Delete Project

- **Endpoint:** `DELETE /api/projects/:projectId`
- **Response:**
  - `{ success: true }` or status code 204

---

## 6. Add Member to Project

- **Endpoint:** `POST /api/projects/:projectId/members`
- **Request Body:**
  - `userId` (string, required)
  - `role` (string, optional, e.g., "admin", "member")
- **Response:**
  - Updated project object or member list

---

## 7. Remove Member from Project

- **Endpoint:** `DELETE /api/projects/:projectId/members/:userId`
- **Response:**
  - Updated project object or member list

---

## 8. Get Project Members

- **Endpoint:** `GET /api/projects/:projectId/members`
- **Response:**
  - `members` (array of user objects with roles)

---

## 9. Project Activity/History (optional)

- **Endpoint:** `GET /api/projects/:projectId/activity`
- **Response:**
  - `activity` (array of activity objects: type, user, timestamp, description)

---

## 10. Project Files/Assets (optional)

- **Endpoint:** `GET /api/projects/:projectId/files`
- **Response:**
  - `files` (array of file metadata objects)

---

## 11. Project Tasks/Issues (optional)

- **Endpoint:** `GET /api/projects/:projectId/tasks`
- **Response:**
  - `tasks` (array of task/issue objects)

---

## General Response Structure

- On error: `{ error: string, details?: any }`
- On success: as described above

---

*Expand or modify as needed for advanced features (permissions, invitations, templates, etc.).*