# Pulse Monitor - Implementation Tasks

## Phase 1: Foundation & Core API

### Task 1: Project Setup
- [ ] Initialize NestJS project with CLI
- [ ] Setup PostgreSQL with Docker Compose (local dev)
- [ ] Setup Prisma ORM with initial schema
- [ ] Configure environment variables (.env.example)
- [ ] Setup ESLint + Prettier
- [ ] Create GitHub Actions CI (lint + test)

### Task 2: Database Schema (Prisma)
- [ ] User model
- [ ] Monitor model (with JSON config for type-specific settings)
- [ ] CheckResult model
- [ ] AlertChannel model
- [ ] Incident model
- [ ] StatusPage model
- [ ] Run initial migration

### Task 3: Authentication
- [ ] Setup NextAuth.js in separate frontend (or use Passport for API)
- [ ] GitHub OAuth integration
- [ ] JWT token handling
- [ ] Protected route middleware

### Task 4: Core Monitoring Service
- [ ] HTTP check service (axios/fetch with timeout)
- [ ] SSL check service (tls module)
- [ ] Response time measurement
- [ ] Status code validation
- [ ] Keyword matching in response body

### Task 5: Queue & Scheduling (BullMQ)
- [ ] Setup Redis + BullMQ
- [ ] Create check scheduler service
- [ ] Dynamic job scheduling based on monitor intervals
- [ ] Handle job failures and retries

### Task 6: Cron Heartbeat System
- [ ] Public ping endpoint (/ping/:monitorId)
- [ ] Track last ping timestamp
- [ ] Grace period calculation
- [ ] Missed ping detection

### Task 7: Alert System
- [ ] Telegram bot setup
- [ ] Alert dispatcher service
- [ ] Telegram message templates
- [ ] Alert throttling (don't spam)

### Task 8: REST API Endpoints
- [ ] CRUD for monitors
- [ ] Pause/resume monitors
- [ ] List check results (with pagination)
- [ ] Current incidents
- [ ] Public ping endpoint (no auth)

### Task 9: Basic Frontend (Next.js)
- [ ] Next.js 14 setup with Tailwind
- [ ] Auth flow (GitHub login)
- [ ] Dashboard layout
- [ ] Monitor list view
- [ ] Create/edit monitor forms
- [ ] Check results history view

### Task 10: Status Pages
- [ ] Public status page generation
- [ ] Uptime percentage calculation
- [ ] Incident history display
- [ ] Basic theming/customization

### Task 11: Deployment
- [ ] Dockerize the app
- [ ] Railway/Render deployment config
- [ ] Database migration on deploy
- [ ] Environment variables setup

### Task 12: Dogfooding
- [ ] Self-monitor the Pulse API
- [ ] Migrate dokploy cron to Pulse heartbeat
- [ ] Add monitors for Ali's other projects

## Phase 2: Polish & Launch Prep

### Post-MVP Tasks
- [ ] Discord webhook integration
- [ ] Slack webhook integration
- [ ] Email alerts (Resend)
- [ ] Custom domain for status pages
- [ ] Team/organization support
- [ ] Billing integration (Stripe)
- [ ] Analytics dashboard
- [ ] API documentation

## Current Focus
Working on: **Phase 1**
Next task: **Task 1 - Project Setup**
