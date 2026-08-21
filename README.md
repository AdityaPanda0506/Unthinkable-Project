# Society Maintenance Tracker

A modern, full-stack society maintenance tracking system built with **Node.js/Express + Prisma (SQLite)** for the backend and **React/Vite + Tailwind CSS v3** for the frontend.

## Features

- **Authentication & RBAC**: Roles for **Admins** and **Residents** with secure JWT token storage and endpoint validation.
- **Resident Dashboard**:
  - Submit complaints with title, description, category, and optional photo upload.
  - View self-submitted complaints with interactive real-time timeline.
- **Admin Dashboard**:
  - Complete list of complaints with search and multi-filtering (Status, Priority, Category).
  - Metrics cards detailing Open, In Progress, Resolved, and glowing SLA Overdue counts.
  - Interactive modal to update status, assign staff/technicians, update priority, and add notes.
- **Notice Board**:
  - Global bulletin. Admins can post, mark important (pins notice to top, glows, and emails residents), and delete notices.
  - Residents have read-only access.
- **Transactional Notifications**: Non-blocking email alerts for status changes or notices (with fallback logging).

## Quick Start

### 1. Install Dependencies
Run the install command from the root directory to set up both frontend and backend automatically:
```bash
npm run install:all
```

### 2. Configure Database & Environment
Prisma is configured to use SQLite out of the box. Generate the database and tables locally:
```bash
npm run db:push
```

### 3. Run Development Servers
Start both the React development server and Express server concurrently:
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Server runs on: `http://localhost:5000`

---

## Database Schema Overview

The relational database is defined declaratively using Prisma:

1. **User**: Represents society members. Roles are restricted to `ADMIN` or `RESIDENT`.
2. **Complaint**: Contains category, title, description, photo attachment URL, priority status (`LOW`, `MEDIUM`, `HIGH`), and resolution state (`OPEN`, `IN_PROGRESS`, `RESOLVED`).
3. **ComplaintHistory**: Read-only ledger capturing status changes, assignments, and resolution notes for audit trails.
4. **Notice**: Board notices, which can be marked as important (`isImportant = true`) to alert residents.
5. **SystemSetting**: Holds global parameters, including the SLA deadline `overdue_threshold_days`.

---

## Backend REST API Docs

All requests (excluding authentication) require the header `Authorization: Bearer <token>`.

### Authentication Endpoints
- `POST /api/auth/register` - Create user. Expects `name`, `email`, `password`, `role`, `flatNumber`, `phone`.
- `POST /api/auth/login` - Verify credentials. Returns JWT.
- `GET /api/auth/me` - Retrieve current session details.

### Notice Board Endpoints
- `GET /api/notices` - Fetch notice feed sorted by importance.
- `POST /api/notices` - (Admin only) Post notice.
- `DELETE /api/notices/:id` - (Admin only) Delete notice.

### Complaint Endpoints
- `POST /api/complaints` - (Resident only) Submit ticket. Supports multipart image file upload.
- `GET /api/complaints` - (Admin only) Get all tickets.
- `GET /api/complaints/my` - (Resident only) Get own tickets.
- `GET /api/complaints/:id` - Retrieve ticket details including timeline logs.
- `PATCH /api/complaints/:id/status` - (Admin only) Update status and assignee. Adds history log.
- `PATCH /api/complaints/:id/priority` - (Admin only) Update priority. Adds history log.
- `DELETE /api/complaints/:id` - Delete complaint.

### Admin Dashboard Analytics
- `GET /api/admin/dashboard` - (Admin only) Retrieve aggregated KPI counters and category breakdowns.
- `PUT /api/admin/dashboard/threshold` - (Admin only) Adjust overdue threshold limit (Days).
