# Velora — Goal Setting & Tracking Portal

> **AtomQuest Hackathon 1.0** | Enterprise Performance Management System

Velora is a full-featured, production-grade Goal Setting & Tracking Portal that supports the complete lifecycle of employee performance goals — from creation, approval, and quarterly check-ins to analytics, escalation, and audit governance.

**🌐 Live Demo:** [https://velora-704569764751.us-central1.run.app](https://velora-704569764751.us-central1.run.app)
*(Deployed on Google Cloud Run)*

## Architecture

![Architecture Diagram](public/architecture.png)

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS | Server-rendered + Client-side UI |
| **Backend** | Next.js Server Actions | API layer (no separate backend) |
| **ORM** | Prisma 7 | Type-safe database access |
| **Database** | PostgreSQL (Supabase) | Cloud-hosted, Mumbai region |
| **Charts** | Recharts | Analytics visualizations |
| **Hosting** | Google Cloud Run | Serverless container deployment |

### Cost Optimization Strategy
- **$0 infrastructure cost** — Supabase free tier (500MB) + Cloud Run free tier
- **No external API calls** — all computation is server-side
- **Connection pooling** via Supabase Pooler (PgBouncer)
- **Static page optimization** — Next.js pre-renders where possible
- **No paid auth service** — context-based role switching

---

## Features Implemented

### ✅ Phase 1 — Goal Creation & Approval (Section 2.1)
- Employee goal sheet creation with Thrust Area, UoM, Target, Weightage
- **Validation rules enforced**: Total weight = 100%, min 10% per goal, max 8 goals
- Manager inline editing, approve, or return-for-rework workflow
- Goals locked on approval — editable only by Admin unlock
- **Shared Goals**: Admin pushes KPIs to multiple employees; recipients adjust weightage only

### ✅ Phase 2 — Achievement Tracking & Quarterly Check-ins (Section 2.2)
- Quarterly update interface for logging Actual vs Planned
- Status selection: Not Started / On Track / Completed
- Manager check-in module with structured feedback comments
- **All 4 UoM formulas implemented**:
  - Min (Numeric/%) → Achievement ÷ Target
  - Max (Numeric/%) → Target ÷ Achievement
  - Timeline → Completion date vs Deadline
  - Zero → If 0 → 100%, else 0%

### ✅ Phase 3 — Check-in Schedule (Section 2.3)
- Configurable cycle with Goal Setting, Q1, Q2, Q3, Q4 date windows
- System auto-detects active quarter for check-in forms

### ✅ User Roles (Section 3)
| Role | Access |
|---|---|
| **Employee** | Dashboard, My Goals, Check-ins |
| **Manager** | + Approvals, Team Check-ins, My Team |
| **Admin/HR** | + Cycles, Users, Shared Goals, Reports, Analytics, Escalations, Audit Log |

### ✅ Reporting & Governance (Section 4)
- **Achievement Report**: CSV export with Planned vs Actual for all employees
- **Completion Dashboard**: Real-time admin dashboard showing adoption rates
- **Audit Trail**: Every post-lock edit is logged with user, timestamp, old/new values

### ✅ Bonus: Escalation Module (Section 5.3)
- 3 configurable rules: Goal not submitted, Approval pending, Check-in overdue
- Severity levels: Info → Warning → Critical
- Auto-notification to affected users
- Admin escalation log with Open/Resolved tracking

### ✅ Bonus: Analytics Module (Section 5.4)
- Thrust Area distribution (bar chart)
- UoM type breakdown (pie chart)
- Goal status progress tracking
- Department completion heatmap
- Goal lifecycle analysis
- Manager effectiveness comparison table

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase account)

### Installation

```bash
git clone https://github.com/prakyath006/Velora.git
cd Velora
npm install
```

### Environment Setup
Create a `.env` file:
```
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

### Database Setup
```bash
npx prisma db push      # Create tables
npx prisma db seed       # Provision evaluation environment
```

The seed script provisions a realistic organizational structure:
- **3 departments**: Engineering, Sales, HR
- **8 employees**, **2 managers**, **1 HR admin**
- Pre-configured performance cycle (FY 2026-27)
- Sample goal sheets in various workflow states

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Login Credentials

The portal uses a **Workspace Launcher** on the login page. Select any role to enter:

| Role | Default User | Department |
|---|---|---|
| Employee | Priya Sharma | Engineering |
| Manager | Vikram Mehta | Engineering |
| Admin | Admin User | HR |

Switch between any of the 11 seeded users from the sidebar dropdown at any time.

---

## Tech Stack

- **Next.js 16.2.6** — App Router with Server Actions
- **React 19** — Latest concurrent features
- **Prisma 7** — Type-safe ORM with PostgreSQL
- **Tailwind CSS 4** — Utility-first styling
- **Recharts** — Data visualization
- **Framer Motion** — Animations
- **Lucide React** — Icon system
- **Sonner** — Toast notifications
- **Supabase** — Managed PostgreSQL (Mumbai region)

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/        # Role-specific dashboards
│   ├── goals/            # Goal viewing & creation
│   ├── checkins/         # Quarterly achievement entry
│   ├── manager/          # Approvals, team check-ins, team view
│   ├── admin/            # Cycles, users, shared goals, analytics, escalations, audit
│   ├── reports/          # CSV export reports
│   └── login/            # Workspace role selector
├── components/           # Reusable UI components
├── lib/
│   ├── actions.ts        # Server actions (all DB operations)
│   ├── auth.tsx          # Auth context provider
│   └── prisma.ts         # Prisma client singleton
└── prisma/
    ├── schema.prisma     # Database schema (12 models)
    └── seed.js           # Environment provisioning script
```

---

## License

Built for AtomQuest Hackathon 1.0. All rights reserved.
