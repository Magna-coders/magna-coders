# Projects API Integration Guide

This document describes all endpoints for the Project section, including request/response structures and usage notes.

---

## 1. Create Project
- **POST** `/api/projects`
- **Body:** `{ name, description?, tags?, visibility, ownerId, members? }`
- **Response:** Project object

## 2. Get All Projects
- **GET** `/api/projects`
- **Query:** `ownerId?, memberId?, visibility?, search?, limit?, offset?`
- **Response:** `{ projects: [...], total }`

## 3. Get Single Project
- **GET** `/api/projects/:projectId`
- **Response:** Full project object

## 4. Update Project
- **PUT** `/api/projects/:projectId`
- **Body:** `{ name?, description?, tags?, visibility?, members? }`
- **Response:** Updated project object

## 5. Delete Project
- **DELETE** `/api/projects/:projectId`
- **Response:** `{ success: true }` or status 204

## 6. Add Member to Project
- **POST** `/api/projects/:projectId/members`
- **Body:** `{ userId, role? }`
- **Response:** Member object

## 7. Remove Member from Project
- **DELETE** `/api/projects/:projectId/members/:userId`
- **Response:** `{ success: true }`

## 8. Get Project Members
- **GET** `/api/projects/:projectId/members`
- **Response:** `{ members: [user objects with roles] }`

## 9. Project Activity/History
- **GET** `/api/projects/:projectId/activity`
- **Response:** `{ activity: [activity objects] }`

## 10. Project Files/Assets
- **GET** `/api/projects/:projectId/files`
- **Response:** `{ files: [file metadata objects] }`

## 11. Project Tasks/Issues
- **GET** `/api/projects/:projectId/tasks`
- **Response:** `{ tasks: [task/issue objects] }`

---

### General Response Structure
- On error: `{ error: string, details?: any }`
- On success: as described above

---

*For advanced features (permissions, invitations, etc.), expand as needed.*
