# Orbita

A modern, self-hosted CRM and project management platform built for freelancers and small agencies. Manage clients, projects, tasks, time tracking, invoicing, and more — all in one place.

## Features

### Core

- **Client Management** — Full CRUD with status tracking (Active, Inactive, Lead) and address autocomplete
- **Project Management** — Status workflow (Proposal > In Progress > Review > Completed), budget and hourly rate tracking, website health checks
- **Task Management** — Kanban board with drag-and-drop, priorities (Low/Medium/High/Urgent), subtasks (up to 20 per task)
- **Time Tracking** — Live timer widget, manual entry, per-entry hourly rates, project and task association
- **Invoicing** — Auto-numbering, quotes and invoices, line item editor, tax calculation, PDF export via `@react-pdf/renderer`

### Integrations

- **GitHub** — OAuth connection per project, repo monitoring (commits, PRs, issues, branches, workflows), file browser
- **Email** — Resend API integration per project, inbox view
- **AI Ad Maker** — Generate ad creatives with Anthropic Claude, multiple formats, design history
- **SEO Checker** — On-demand site audit with scoring and recommendations

### Tools

- **Credential Vault** — Encrypted storage of passwords, API keys, and access credentials per project
- **Branding** — Logo upload and management, brand profile, favicon generation
- **Analytics Dashboard** — Revenue charts, hours by project, invoice status, task completion, profitability
- **Global Search** — Quick search across clients, projects, invoices, and tasks

### Account

- **Authentication** — Email/password login via NextAuth v5 with JWT strategy
- **Profile** — Avatar upload, name/email editing, password management
- **Appearance** — Light/dark/system theme switcher
- **Settings** — Global API keys (Anthropic, GitHub OAuth, Resend)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React 19) |
| Database | PostgreSQL + Prisma v7 |
| Auth | NextAuth v5 (beta) |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Icons | Tabler Icons |
| Charts | Recharts |
| Rich Text | TipTap |
| Drag & Drop | dnd-kit |
| PDF | @react-pdf/renderer |
| Image Processing | Sharp |
| AI | Anthropic SDK |
| Email | Resend |
| Language | TypeScript 5 |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd orbita
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env` file in the root:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/orbita"
   AUTH_SECRET="your-random-secret-here"
   ```

4. **Run migrations**

   ```bash
   npx prisma migrate deploy
   ```

5. **Seed the database** (optional)

   ```bash
   npx prisma db seed
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  actions/        Server actions (form handlers, mutations)
  app/
    (auth)/       Login page
    (dashboard)/  All authenticated pages
    api/          API routes (avatar, PDF, health checks, AI, etc.)
  components/     UI components (forms, tables, dialogs, charts)
    ui/           shadcn/ui primitives
    analytics/    Analytics chart components
    github/       GitHub integration components
  hooks/          Custom React hooks (timer, debounce, confirm)
  lib/            Utilities (auth, prisma, encryption, GitHub API)
  types/          TypeScript interfaces
prisma/
  schema.prisma   Database schema
  migrations/     Migration history
  seed.mjs        Database seeder
```

## Database Schema

The application uses 15 models organized around the core business workflow:

- **User/Account/Session** — Authentication and identity
- **Client** — Customer records with status tracking
- **Project** — Work containers linked to clients
- **Task/Subtask** — Work items with Kanban workflow
- **TimeEntry** — Time logs linked to projects and tasks
- **Invoice/InvoiceItem** — Billing documents with line items
- **Credential** — Encrypted project credentials
- **EmailConfig** — Per-project email integration
- **GitHubConfig** — Per-project GitHub connection
- **AdDesign** — AI-generated ad creative history
- **SiteSettings** — Global API keys and configuration

## License

Private project. All rights reserved.
