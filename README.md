# Nearlook Agency ERP & CRM 🚀
### Enterprise Management Platform for IT Services & Digital Marketing Agencies

A comprehensive ERP and CRM web application built specifically for IT Services, Digital Marketing, and SEO agencies. The system unifies lead pipelines, recurring retainer management, encrypted client credentials vault, Kanban task workflows with review gates, staff capacity tracking, time logging, recurring invoicing, client P&L reporting, and automated Meta WhatsApp Cloud API event triggers.

---

## 🌟 Core Modules

### 1. Agency CRM & Leads Pipeline
- **Track Opportunities**: Lead Name, Business Name, WhatsApp, Service Type (SEO, Social Media, Web Dev, Performance Ads, Branding, Full Suite), Lead Stage, Assigned Account Lead, Estimated Deal Value.
- **Stage Progression**: New -> Contacted -> Proposal Sent -> Negotiation -> Won -> Lost.
- **Automated WhatsApp Welcome**: Instantly triggers personalized greeting when lead inquiry is created.
- **Automated WhatsApp Proposals**: One-click dispatch of customized proposal links to prospective clients.

### 2. Client & Service Retainer Management
- **Retainer vs Project Separation**:
  - **Recurring Monthly Retainers**: Tracks monthly fee, billing cycle day (e.g. 1st or 15th), start/renewal dates, deliverables.
  - **One-Time Milestone Contracts**: Tracks project milestones and development progress.
- **Credentials Vault (AES-256 Encrypted)**:
  - Cryptographically secured fields for WordPress, Meta Business Manager, Hosting (AWS/cPanel), Analytics (GA4/GTM), and Shopify logins.
  - Role-based **Reveal Password** with AES-256 decryption, copy-to-clipboard, and security notes.

### 3. Task & Project Management (Kanban Board)
- **Status Columns**:
  - `Backlog`
  - `To Do`
  - `In Progress`
  - `Internal Review` (Triggers WhatsApp notification to PM)
  - `Client Review`
  - `Completed`
- **Drag-and-Drop Kanban**: Intuitive HTML5 drag-and-drop interface with dual List View.
- **Subtasks Progress Checklist**: Interactive inline checklist with progress bar.
- **Recurring Task Generator**: Auto-generates weekly retainer performance reports and monthly technical audits for all active retainers.

### 4. Staff Management & Time Tracking
- **Agency Roles**: Admin, Project Manager, Developer, Designer, Content Writer, Marketer.
- **Staff Workload Matrix**: Visualizes active concurrent tasks, capacity load percentage, and availability indicators.
- **Live Stopwatch Time Tracker**: Start/Stop stopwatch widget for tasks with billable vs non-billable classification.

### 5. Invoicing & Financial Accounts
- **Recurring & Milestone Invoices**: Retainer billing and web dev progress milestones.
- **Client Expense Logger**: Directly records SaaS tools (Ahrefs, TripleWhale, SEMrush), staging hosting (Cloudways/AWS), domain purchases, and subcontractor fees per client.
- **Client Profit & Loss (P&L) Matrix**: Real-time calculation of client-level revenue, expenses, net profit, and profit margin %.
- **Overdue Reminders**: Automated WhatsApp payment due reminder trigger for unpaid invoices.

### 6. Meta WhatsApp Cloud API Engine (`whatsappService.ts`)
- **Centralized Engine**: Built on Meta WhatsApp Cloud API (Graph API v20.0).
- **Automated Client Triggers**:
  - Lead Welcome Notice
  - Proposal Sent Notice
  - Monthly Retainer Invoice Notice
  - Milestone Completion Alert
  - Overdue Payment Reminder
- **Automated Staff Triggers**:
  - Task Assignment Alert
  - Content / Design Approval Request
  - Overdue Task Nudge
- **Dual Mode**: Safe out-of-the-box Simulation Mode + direct `wa.me` fallback link for manual one-click chat.
- **Audit Log Page**: Complete timestamped audit trail showing recipient, status (DELIVERED / SIMULATED / FAILED), and raw Meta JSON payload.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Dark/Light mode theme system
- **Icons**: Lucide Icons
- **Database / ORM**: PostgreSQL with Prisma ORM
- **Security**: AES-256-CBC cipher with SHA-256 key derivation for credentials vault
- **API Engine**: Meta WhatsApp Cloud API (Graph API v20.0)

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- Node.js v18+ (tested on Node v22)
- PostgreSQL database (optional; in-memory repository enables immediate out-of-the-box testing)

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your credentials:
```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/it_crm_db?schema=public"

# AES-256 Credentials Vault Secret Key (32-byte string)
VAULT_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Meta WhatsApp Cloud API Settings
WHATSAPP_CLOUD_API_TOKEN="EAAB..."
WHATSAPP_PHONE_NUMBER_ID="109283746592019"
WHATSAPP_BUSINESS_ACCOUNT_ID="294857201948572"

# Simulation Mode: Set to "true" for testing without live WhatsApp API credentials
WHATSAPP_SIMULATION_MODE="true"
```

### 3. Database Setup (Prisma)
To initialize PostgreSQL database tables:
```bash
npx prisma db push
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Architecture

```
d:\New project code\IT CRM/
├── prisma/
│   └── schema.prisma           # Prisma relational schema (Staff, Leads, Clients, Vault, Tasks, Invoices, WhatsAppLogs)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── clients/        # Client & Retainer API endpoints
│   │   │   ├── expenses/       # Client expenses API
│   │   │   ├── invoices/       # Invoicing & WhatsApp due reminders
│   │   │   ├── leads/          # Leads pipeline & WhatsApp welcome
│   │   │   ├── metrics/        # Dashboard KPIs & aggregates
│   │   │   ├── reports/pl/     # Client P&L and profit margin calculation
│   │   │   ├── staff/          # Staff workload matrix & capacity
│   │   │   ├── tasks/          # Kanban tasks & recurring task generator
│   │   │   ├── vault/          # AES-256 credential storage & reveal
│   │   │   └── whatsapp/       # Meta WhatsApp dispatch & audit logs
│   │   ├── clients/page.tsx    # Client retainers & credentials vault view
│   │   ├── finance/page.tsx    # Invoices, expense logger & client P&L
│   │   ├── globals.css         # Theme tokens, dark/light styles
│   │   ├── layout.tsx          # Root layout with sidebar navigation
│   │   ├── leads/page.tsx      # Agency CRM & leads pipeline
│   │   ├── page.tsx            # Operations command center & KPI dashboard
│   │   ├── staff/page.tsx      # Staff directory, workload matrix & time tracker
│   │   ├── tasks/page.tsx      # Kanban board, list view, subtasks
│   │   └── whatsapp/page.tsx   # WhatsApp Cloud API status & audit logs
│   ├── components/
│   │   ├── Header.tsx          # Top bar with sync recurring tasks & theme toggle
│   │   └── Sidebar.tsx         # Agency navigation & WhatsApp status pill
│   └── lib/
│       ├── crypto.ts           # AES-256-CBC credentials encryption & decryption
│       ├── dataService.ts      # Repository layer & seed agency dataset
│       ├── types.ts            # Full TypeScript interfaces
│       └── whatsappService.ts  # Central Meta WhatsApp Cloud API engine
├── .env.example
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```
