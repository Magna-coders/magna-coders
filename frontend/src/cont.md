# Magna Contract Management System - Frontend Implementation

This document describes the frontend implementation of the Magna Contract Management System, which provides a comprehensive interface for managing contracts, milestones, escrow, and collaboration.

## 1. Contract Management Interface

### 1.1 Main Contract Page (`/contract`)

**Implemented Features:**
- **Retractable Left Control Panel**: Similar to LeftPanel component with expand/collapse functionality
  - Project Details modal (contract information, timeline, metadata)
  - Documents modal (contract files with download/view actions)
  - Groups modal (project collaboration groups)
  - Magna AI modal (AI assistant for contract support)

- **Tabbed Navigation**: Four main sections
  - **Overview**: Contract progress, key metrics, quick actions
  - **Milestones**: Milestone management, submissions, reviews
  - **Escrow**: Payment tracking, transaction history, funding status
  - **Activity**: Contract timeline, activity logs, status changes

- **Responsive Design**: Mobile-first approach with desktop optimizations
  - Mobile drawer for left panel on small screens
  - Desktop fixed sidebar with retractable functionality
  - Touch-friendly controls and interactions

### 1.2 Contract Status Management

**Supported Statuses:**
- `DRAFT` - Initial contract creation
- `PENDING_DEVELOPER_ACCEPTANCE` - Sent to developer for review
- `ACTIVE_UNFUNDED` - Accepted but awaiting funding
- `ACTIVE_FUNDED` - Active with escrow funding
- `PAUSED` - Temporarily suspended
- `COMPLETED` - Successfully finished
- `CANCELLED` - Terminated by mutual agreement
- `TERMINATED` - Forcefully ended

### 1.3 Milestone Management

**Milestone Statuses:**
- `NOT_STARTED` - Awaiting work to begin
- `IN_PROGRESS` - Developer actively working
- `SUBMITTED` - Work submitted for review
- `IN_REVIEW` - Under client review
- `CHANGES_REQUESTED` - Revisions required
- `APPROVED` - Work accepted
- `REJECTED` - Work declined
- `RELEASED` - Payment released

**Features:**
- Progress submission with evidence (files, links, screenshots, demo URLs)
- Milestone review system with approval/rejection/change requests
- Automatic progress calculation based on approved milestones
- Evidence management with multiple submission types

### 1.4 Escrow Integration

**Transaction Types:**
- `FUND` - Client adds money to escrow
- `RELEASE` - Payment released to developer
- `REFUND` - Money returned to client
- `ADJUSTMENT` - Manual balance corrections

**Features:**
- Real-time escrow balance tracking
- Transaction history with detailed logs
- Funding mode support (Full Upfront, Milestone-based)
- Payment status indicators and progress bars

## 2. Modal Components

### 2.1 ProjectDetailsModal
- **Purpose**: Display comprehensive contract information
- **Features**:
  - Contract title, description, and status
  - Client and developer information
  - Timeline and estimated delivery dates
  - Payment details (total amount, currency, funding mode)
  - Milestone summary and progress
  - Metadata including estimated days and terms

### 2.2 DocumentsModal
- **Purpose**: Manage contract-related documents
- **Features**:
  - File upload and download functionality
  - Document preview and viewing
  - File organization by type (contracts, specifications, designs)
  - Document status tracking (pending, approved, rejected)
  - Quick action buttons for common operations

### 2.3 GroupsModal
- **Purpose**: Project collaboration and communication
- **Features**:
  - Group creation and management
  - Member invitation and role assignment
  - Unread message indicators
  - Last activity timestamps
  - Quick access to group conversations

### 2.4 MagnaAIModal
- **Purpose**: AI-powered contract assistance
- **Features**:
  - Chat interface for contract-related queries
  - Quick action buttons for common requests
  - AI-generated suggestions and recommendations
  - Conversation history and context retention
  - Integration with contract data for personalized responses

## 3. Technical Implementation

### 3.1 State Management
- **React Hooks**: useState for local component state
- **Modal State**: Centralized modal visibility management
- **Responsive State**: Mobile panel visibility and sidebar expansion
- **Tab State**: Active tab tracking and content switching

### 3.2 Styling and Design
- **Color Scheme**: Dark theme with Magna brand colors
  - Primary: `#E70008` (Magna red)
  - Background: `#0a0a0a` (Deep black)
  - Text: `#F9E4AD` (Warm gold)
  - Borders: `white/10` (Subtle white transparency)

- **Component Design**:
  - Rounded corners (`rounded-xl`, `rounded-2xl`, `rounded-3xl`)
  - Gradient backgrounds for special elements
  - Hover effects and smooth transitions
  - Backdrop blur for modal overlays

### 3.3 TypeScript Integration
- **Type Safety**: Full TypeScript implementation with interfaces
- **Contract Interface**: Comprehensive contract data structure
- **Milestone Interface**: Detailed milestone and submission types
- **Escrow Interface**: Transaction and account management types

## 4. User Experience Features

### 4.1 Accessibility
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Color Contrast**: WCAG compliant color combinations
- **Touch Targets**: Mobile-appropriate button sizes

### 4.2 Performance
- **Lazy Loading**: Components load on demand
- **Image Optimization**: Efficient image handling and caching
- **State Optimization**: Minimal re-renders and efficient updates
- **Responsive Images**: Adaptive image sizing for different devices

### 4.3 Error Handling
- **Graceful Degradation**: Functionality works even with missing data
- **Loading States**: Clear indicators during data fetching
- **Error Messages**: User-friendly error descriptions
- **Retry Mechanisms**: Automatic retry for failed operations

## 5. Integration Points

### 5.1 Backend API Integration
The frontend is designed to work with the following backend endpoints:
- `GET /contracts/{id}` - Fetch contract details
- `GET /contracts/{id}/milestones` - Fetch milestone data
- `GET /contracts/{id}/escrow` - Fetch escrow information
- `GET /contracts/{id}/activity` - Fetch activity logs
- `POST /milestones/{id}/submit` - Submit milestone work
- `POST /milestones/{id}/review` - Review milestone submissions
- `POST /contracts/{id}/fund` - Add escrow funding
- `POST /contracts/{id}/release` - Release milestone payments

### 5.2 File Upload Integration
- **Drag and Drop**: Modern file upload interface
- **Multiple Formats**: Support for various file types
- **Progress Tracking**: Upload progress indicators
- **Validation**: File type and size validation

## 6. Future Enhancements

### 6.1 Planned Features
- **Real-time Updates**: WebSocket integration for live updates
- **Push Notifications**: Browser notification support
- **Offline Support**: PWA capabilities for offline access
- **Advanced Analytics**: Detailed contract performance metrics

### 6.2 Mobile App Integration
- **React Native**: Potential mobile app development
- **Push Notifications**: Mobile-specific notification system
- **Camera Integration**: Document scanning capabilities
- **Biometric Auth**: Enhanced security features

---

**Note**: This implementation represents the current frontend state of the Magna Contract Management System. The backend specifications in sections 14-17 of the original document provide the API structure that this frontend is designed to consume.

---

# Appendix: Original Backend Specification

## 14. Create Contract (Manual Draft + AI Generator) — Backend Spec

This section defines the contract creation pipeline used by the “Create New Contract” modal:
- Mode A: AI Contract Generator
- Mode B: Manual Draft
- Both produce a `DRAFT` contract that can be edited before sending to developer.

---

### 14.1 Contract Draft Lifecycle (Shared)

**Lifecycle**
- Create draft (DRAFT)
- Add or edit milestones (still DRAFT)
- Add terms/policies metadata (still DRAFT)
- Send to developer → `PENDING_DEVELOPER_ACCEPTANCE`

**Rules**
- A contract cannot be sent unless:
  - developerId is set
  - milestones.length >= 1
  - sum(milestone.amount) == contract.totalAmount (enforced strictly)
  - each milestone has title, description, acceptanceCriteria, amount, dueAt
  - termsVersion exists
  - currency exists

**Recommended Draft Fields**
- title
- description
- currency (KES default)
- fundingMode
- totalAmount
- startAt (optional)
- metadata:
  - clientName
  - developerName (optional until developer selected)
  - estimatedDays
  - ownershipRule: `FINAL_RELEASE`
  - revisionsPerMilestone: `2`
  - supportDays: `14`
  - latePenaltyRatePerDay: `0.02`

---

### 14.2 Manual Draft (Mode B)

#### UI expectation
User writes contract terms and milestones manually, then saves draft, then sends.

#### Endpoints

**POST `/contracts`**
Creates a base draft contract.

Body:
- title
- description
- developerId (optional at creation)
- currency (default KES)
- fundingMode
- startAt (optional)
- metadata (optional)

Returns:
- Contract object (DRAFT)

**POST `/contracts/{id}/milestones`**
Adds milestone(s) to draft.

Body:
- title
- description
- acceptanceCriteria
- amount
- dueAt
- orderIndex

Returns:
- Milestone

**PATCH `/contracts/{id}`**
Edit contract draft fields.

Body (partial):
- title, description, developerId, fundingMode, totalAmount, startAt, metadata

Returns:
- updated Contract

**PATCH `/milestones/{id}`**
Edit milestone fields (draft-safe, later restricted after acceptance).

**POST `/contracts/{id}/validate`**
Validates draft completeness before sending.

Returns:
- `{ ok: boolean, errors: string[], warnings: string[] }`

**POST `/contracts/{id}/send`**
Transitions DRAFT → PENDING_DEVELOPER_ACCEPTANCE.
Creates activity log: `CONTRACT_SENT`.

---

### 14.3 AI Contract Generator (Mode A)

#### UI expectation
- User enters a project description.
- AI generates: title, description, milestone plan, amounts, due dates, acceptance criteria, and default policies.
- User should be able to review and edit before sending.

#### Principle
AI should not directly create an ACTIVE contract. It creates a **draft proposal** that the client edits/approves.

#### Endpoints

**POST `/ai/contracts/generate`**
Generates a structured contract proposal from a project description.

Body:
- promptText (string)  *(the textarea in your modal)*
- currency (default KES)
- fundingMode (optional; default NEXT_MILESTONE_REQUIRED)
- targetBudget? (optional)
- desiredMilestoneCount? (optional)
- startAt? (optional)

Returns:
- `ContractProposal` (not yet persisted) OR can return `draftContractId` if you want auto-save.

Recommended return shape:
- proposalId
- title
- description
- currency
- fundingMode
- totalAmount
- startAt
- estimatedDays
- terms:
  - revisionsPerMilestone = 2
  - supportDays = 14
  - ownershipRule = FINAL_RELEASE
  - latePenaltyRatePerDay = 0.02
- milestones[]:
  - title
  - description
  - acceptanceCriteria
  - amount
  - dueAt
  - orderIndex

**POST `/contracts/from-proposal`**
Converts proposal into a persisted DRAFT contract.

Body:
- proposalId OR full proposal object
- clientId
- developerId? (optional)

Returns:
- Contract (DRAFT) with milestones created

**Security**
- Rate limit AI generation per user.
- Log prompts + outputs for abuse monitoring (store minimal, privacy-safe).
- Reject if prompt contains malicious data extraction attempts.

**Activity Logs**
- `AI_CONTRACT_GENERATED`
- `AI_PROPOSAL_SAVED_TO_DRAFT`

---

### 14.4 “Create Contract” Modal States (Backend Alignment)

Modal has 3 internal modes:
- view (choose AI or manual)
- ai (prompt → generate)
- create (manual form editing)

Backend must support:
- fast draft creation
- partial saves (autosave optional)
- validate before send
- developer selection (by ID)

---

## 15. Contracts List Screen — Backend Spec

This section defines the “Contracts list” screen even if you haven’t pasted it yet, because you will need it.

### 15.1 List Requirements (Common UI Needs)
- Filter by role: CLIENT or DEVELOPER
- Filter by status: DRAFT, ACTIVE_FUNDED, PAUSED, etc.
- Search by title / clientName / developerName
- Sort: most recent updatedAt first
- Pagination

### 15.2 Endpoint

**GET `/contracts`**
Query params:
- role=client|developer
- status= (optional comma-separated)
- q= (search string)
- sort=updatedAt:desc (default)
- page, pageSize

Returns:
- items[]: ContractListItem
- pageInfo: { page, pageSize, totalItems, totalPages }

ContractListItem recommended fields:
- id
- title
- status
- totalAmount
- currency
- updatedAt
- createdAt
- clientId
- developerId
- metadata.clientName
- metadata.developerName
- milestonesSummary:
  - total
  - releasedCount
  - activeCount (IN_PROGRESS or SUBMITTED)
  - pendingCount (NOT_STARTED)
- escrowSummary:
  - fundedTotal
  - releasedTotal
  - status (ACTIVE/FROZEN/CLOSED)

### 15.3 Detail endpoint (used when clicking a contract)
**GET `/contracts/{id}`**
Must return full nested model (milestones + submissions + escrow + transactions + activityLogs)

---

## 16. Developer Selection & Invitations (Needed for Send)

Even if the UI doesn’t show the picker yet, “send” requires developerId.

### 16.1 Endpoints

**GET `/developers/search`**
Query params:
- q (name/username/skills)
- page, pageSize

Return:
- developer summaries: { id, name, username, rating?, skills?, avatar? }

**POST `/contracts/{id}/invite`** *(optional if “send” implies invite)*
Body:
- developerId
Return:
- updated contract in PENDING_DEVELOPER_ACCEPTANCE
- activity: CONTRACT_SENT

---

## 17. Notifications (Minimal Requirements)

The UI implies these notifications exist:
- Developer invited to contract
- Client notified of submission
- Developer notified of review decision
- Both notified when dispute opened/resolved

Backend v1 approach:
- store Notification objects and let frontend poll OR push via websockets later.

Recommended minimal endpoint:
- GET `/notifications`
- POST `/notifications/{id}/read`