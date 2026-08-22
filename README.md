<div align="center">

<h1>
  🛠️ SocietyPulse
</h1>

<p><strong>A full-stack society maintenance & complaint management platform</strong><br/>
Built for apartment communities — bridging residents and administration through a clean, tracked, auditable workflow.</p>

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://unthinkable-project-two.vercel.app/login)
[![Backend](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render)](https://society-maintenance-api-zime.onrender.com)
[![GitHub](https://img.shields.io/badge/Source%20Code-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/AdityaPanda0506/Unthinkable-Project)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/AdityaPanda0506/Unthinkable-Project/ci-cd.yml?branch=main&label=CI%2FCD&style=for-the-badge&logo=githubactions)](https://github.com/AdityaPanda0506/Unthinkable-Project/actions)

<br/>

</div>

---

## 🎥 Demo Video

<div align="center">
  <video src="https://github.com/AdityaPanda0506/Unthinkable-Project/raw/main/docs/Unthinkable%20demo.mp4"
         controls
         width="100%"
         style="max-width:900px;border-radius:12px;">
  </video>
</div>

---

## 📌 Quick Links

| | |
|---|---|
| 🌐 **Live App** | https://unthinkable-project-two.vercel.app/login |
| 🔌 **API Base URL** | https://society-maintenance-api-zime.onrender.com/api |
| 📂 **Source Code** | https://github.com/AdityaPanda0506/Unthinkable-Project |
| 🔑 **Demo Admin** | `admin@society.com` / `Admin@123` |
| 👤 **Demo Resident** | `resident@society.com` / `Resident@123` |

---

## 🧭 What This Solves

Apartment societies run on WhatsApp groups and phone calls. Complaints get lost. Residents don't know if anyone is working on their issue. Admins have no visibility into what is pending or overdue.

**SocietyPulse** replaces all of that with:

- A clean complaint portal for residents with photo uploads and live status tracking
- An admin operations desk with filters, priority controls, and SLA overdue alerts
- A full immutable audit trail on every complaint — who changed what, when, and why
- A pinned notice board with email alerts for important announcements

---

## 🎬 Feature Walkthrough

### 👤 Resident View
- Register with flat number, email, and phone
- File a maintenance complaint — category, title, description, optional photo
- View all personal complaints in a card-based list (All / Active / Resolved tabs)
- Expand any complaint to see the **full status lifecycle timeline**
- Receive an **email notification** whenever the admin updates their complaint

### 🛡️ Admin View
- See every complaint across the society in a sortable, filterable data table
- Filter by **status**, **priority**, **category**, or the **SLA overdue** flag
- Assign complaints to maintenance staff
- Set priority (Low / Medium / High) and update status (Open → In Progress → Resolved)
- Every status change writes an **immutable history log** with a timestamp and optional note
- **Overdue complaints** surface with a red SLA badge and appear highlighted at the top
- Post notices to the notice board — pin important ones to send email alerts to all residents

### 📊 Admin Dashboard
- Total complaints broken down by **status** (Open / In Progress / Resolved)
- Complaints grouped by **category** (Plumbing, Electrical, Lift, etc.)
- Live **overdue complaint count**
- Recent activity feed

---

## 🏗️ System Architecture

<div align="center">
  <img src="docs/architecture.png" alt="SocietyPulse System Architecture" width="900"/>
</div>

<br/>

The platform is a four-tier system:

- **Client** (React + Vite on Vercel) — authenticated via Bearer JWT, communicates over HTTPS
- **Backend API** (Node.js + Express on Render) — JWT & RBAC middleware, Multer file pipes, Prisma `$transaction` for atomic writes
- **Data Layer** (PostgreSQL on Supabase/Render) — normalized schema: `User`, `Complaint`, `ComplaintHistory`, `Notice`, `SystemSetting`
- **Integrations** — Cloudinary for photo CDN, Nodemailer/Mailtrap for email alerts, cron-job.org for free uptime pings

---

## ⚡ Performance Benchmarks

Tested under simulated concurrency with 100 virtual threads on `GET /api/notices`:

| Metric | Result |
|--------|--------|
| P50 Latency | 127 ms |
| P95 Latency | 131 ms ✅ (target ≤ 150 ms) |
| P99 Latency | 133 ms |
| Error Rate | 0% |
| Concurrent double-resolve attempts | 1 commit, 9 safe rollbacks ✅ |

---

## 🗄️ Database Schema

```prisma
model User {
  id          String   @id @default(uuid())
  name        String
  email       String   @unique
  password    String                       // bcrypt hashed
  role        String   @default("RESIDENT") // RESIDENT | ADMIN
  flatNumber  String?
  phone       String?
  createdAt   DateTime @default(now())
}

model Complaint {
  id           String   @id @default(uuid())
  residentId   String
  assignedToId String?
  category     String                      // Plumbing | Electrical | Lift | Security | General
  title        String
  description  String
  photoUrl     String?                     // Cloudinary URL or local path
  priority     String   @default("MEDIUM") // LOW | MEDIUM | HIGH
  status       String   @default("OPEN")   // OPEN | IN_PROGRESS | RESOLVED
  createdAt    DateTime @default(now())
  resolvedAt   DateTime?
  history      ComplaintHistory[]
}

model ComplaintHistory {
  id          String   @id @default(uuid())
  complaintId String
  changedById String
  fromStatus  String?                      // null on creation
  toStatus    String
  adminNote   String?
  timestamp   DateTime @default(now())
}

model Notice {
  id          String   @id @default(uuid())
  authorId    String
  title       String
  content     String
  isImportant Boolean  @default(false)    // pinned + triggers email
  createdAt   DateTime @default(now())
}

model SystemSetting {
  key   String @id                        // e.g. "overdue_threshold_days"
  value String                            // e.g. "3"
}
```

> **Overdue detection** is configurable via `SystemSetting` — the threshold (default 3 days) is stored in the database, not hardcoded.

---

## 🔌 API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/auth/register` | Public | Register resident account (Admins guarded against mass assignment) |
| `POST` | `/auth/login` | Public | Returns JWT |

### Complaints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/complaints/my` | Resident | Get own complaints |
| `POST` | `/complaints` | Resident | File new complaint (multipart/form-data) |
| `GET` | `/complaints` | Admin | Get all complaints (filterable) |
| `GET` | `/complaints/:id` | Auth | Get complaint + full history |
| `PATCH` | `/complaints/:id` | Admin | Update status, priority, assign staff |
| `DELETE` | `/complaints/:id` | Admin | Delete complaint |

### Notices
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/notices` | Auth | Get all notices (pinned first) |
| `POST` | `/notices` | Admin | Post a notice, optionally pin + email blast |
| `DELETE` | `/notices/:id` | Admin | Delete a notice |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/admin/dashboard` | Admin | Stats: counts by status, category, overdue |

---

## 🔒 Security Design

| Concern | Implementation |
|---------|---------------|
| Password storage | `bcryptjs` with 10 salt rounds |
| Session management | Stateless JWT (1-day expiry) |
| RBAC enforcement | `requireRole` middleware on every protected route |
| Privilege Escalation | Public self-registration hardcoded to RESIDENT; admin roles require direct DB provisioning or secure environment secrets |
| BOLA / IDOR | Residents can only read/write **their own** complaints; verified server-side |
| File uploads | MIME type check + 5 MB size limit via Multer before Cloudinary |
| Atomic status updates | Prisma `$transaction` prevents race conditions on concurrent updates |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js ≥ 20
- PostgreSQL (or use the hosted Supabase URL from `.env.example`)

### 1 — Clone & Install

```bash
git clone https://github.com/AdityaPanda0506/Unthinkable-Project.git
cd Unthinkable-Project
npm run install:all
```

### 2 — Configure Environment

```bash
cp .env.example server/.env
cp .env.example .env
```

Edit `server/.env` with your values:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key

# PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Cloudinary (optional — falls back to local storage)
CLOUDINARY_URL=

# SMTP (optional — falls back to console log)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
SMTP_FROM="SocietyPulse <noreply@society.com>"

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3 — Database Setup

```bash
npm run db:push
```

This syncs the schema and seeds the default `overdue_threshold_days = 3` setting.

### 4 — Start Development Servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |

---

## 🏛️ System Design Notes

### Complaint History Model

Every status transition writes a new row to `ComplaintHistory` — it never mutates existing rows. The schema captures `fromStatus`, `toStatus`, an optional `adminNote`, the acting user's ID, and a precise `timestamp`. This creates an immutable ledger that cannot be retroactively altered, making it suitable for audit and dispute resolution.

### Overdue Detection

Overdue threshold is stored in `SystemSetting` as a key-value pair (`overdue_threshold_days = 3`). At query time, the backend dynamically computes whether `(now - complaint.createdAt) > threshold` and attaches an `isOverdue` boolean to each complaint response. This means the threshold can be changed without redeployment.

### Photo Handling

Photo uploads use Multer for request parsing and field validation (MIME type, 5 MB cap). If `CLOUDINARY_URL` is configured, images are streamed to Cloudinary via `multer-storage-cloudinary` and the returned CDN URL is persisted. If not configured, images are saved to `/uploads` on the server filesystem with a relative path stored in the database. This dual-mode design keeps local development zero-dependency.

### Notification Flow

Email dispatch runs in a fire-and-forget pattern — it is triggered after the database commit succeeds but does not block the HTTP response. If the SMTP server is unreachable, the error is logged to the console and the API still returns `200 OK`. This means notification failures are never surfaced to the end user and do not corrupt data integrity.

---

## 📁 Project Structure

```
Unthinkable-Project/
├── .github/workflows/ci-cd.yml   # GitHub Actions — test + deploy
├── client/                       # React + Vite frontend
│   ├── src/
│   │   ├── api/                  # Axios client with JWT interceptor
│   │   ├── components/           # Navbar, StatusBadge, PriorityBadge, Timeline
│   │   ├── context/              # AuthContext (JWT decode + role routing)
│   │   └── pages/                # Login, Register, ResidentDashboard, AdminComplaints, Notices, Dashboard
│   ├── vercel.json               # SPA catch-all rewrite rule
│   └── tailwind.config.js
├── server/                       # Node.js + Express backend
│   ├── prisma/
│   │   └── schema.prisma         # Data models + relations
│   └── src/
│       ├── config/               # Prisma client, Cloudinary config
│       ├── middleware/           # auth.js (JWT + RBAC), upload.js (Multer)
│       ├── controllers/          # authController, complaintController, noticeController, dashboardController
│       └── routes/               # Modular Express route files
├── .env.example
└── README.md
```

---

## 🔄 CI/CD Pipeline

Every push to `main` triggers a GitHub Actions workflow:

1. **Install** backend and frontend dependencies
2. **Validate** Prisma schema syntax
3. **Run** backend test suite (`npm test --if-present`)
4. **Build** React production bundle
5. **Deploy** — Render webhook (backend) + Vercel action (frontend)

---

## 👨‍💻 Built by Aditya Panda

Engineering this platform end-to-end — schema design, REST API, React UI, CI/CD pipeline, and cloud deployment.

[![GitHub](https://img.shields.io/badge/GitHub-AdityaPanda0506-181717?style=flat-square&logo=github)](https://github.com/AdityaPanda0506)

---

<div align="center">
<sub>Built with Node.js · Express · Prisma · PostgreSQL · React · Vite · Tailwind CSS · Cloudinary · Nodemailer · Vercel · Render</sub>
</div>
