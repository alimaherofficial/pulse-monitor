# Pulse Monitor - Product Requirements Document

## Overview
A dead-simple monitoring SaaS for indie developers and small teams. Monitors HTTP endpoints, cron jobs, and SSL certificates with alerts via Telegram/Discord.

## Core Problem
Existing monitoring tools are either:
- **Enterprise overkill** (Datadog, New Relic) - complex pricing, steep learning curve
- **Too limited** (UptimeRobot free tier) - 5-minute checks, no cron job monitoring
- **DIY frustration** - everyone builds their own cron-based monitoring that breaks silently

## Target Audience
- Indie developers running side projects
- Bootstrapped SaaS founders
- Small teams (2-10 people)
- Agencies managing client sites

## MVP Features (Phase 1)

### 1. HTTP Endpoint Monitoring
- URL status check (200 OK, response time)
- Custom expected status codes
- Keyword/JSON path matching in response
- Check intervals: 1min, 5min, 15min, 30min, 1hr
- Global locations (start with 1 region, scale later)

### 2. Cron Job Heartbeat Monitoring
- Each cron job gets unique ping URL
- Job "checks in" by pinging URL
- Alert if no ping received within expected window
- Support grace periods (e.g., "expect ping every hour ±10min")

### 3. SSL Certificate Monitoring
- Monitor expiry dates
- Alert at 30, 14, 7, 1 days before expiry

### 4. Alert Channels
- Telegram bot (primary - aligns with Ali's stack)
- Discord webhooks
- Slack webhooks
- Email (Postmark/Resend)

### 5. Public Status Pages
- Custom subdomain (status.yoursaas.com)
- Beautiful, minimal design
- Show uptime %, current status, incident history
- Password protection option

## Tech Stack
- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Queue:** BullMQ (Redis) for check scheduling
- **Frontend:** Next.js 14 + Tailwind CSS
- **Auth:** NextAuth.js (GitHub OAuth)
- **Hosting:** Railway/Render (start cheap)
- **Monitoring:** Self-hosted (dogfood!)

## Data Model

### User
- id, email, name, avatar
- telegramChatId (for alerts)
- plan (free/pro/team)
- createdAt, updatedAt

### Monitor
- id, userId, name
- type: http | cron | ssl
- config (JSON with type-specific settings)
- interval (for http)
- gracePeriod (for cron)
- isPaused, createdAt, updatedAt

### CheckResult
- id, monitorId
- status: up | down | unknown
- responseTime (ms)
- httpStatusCode
- errorMessage
- checkedAt

### Alert
- id, monitorId
- type: telegram | discord | slack | email
- config (webhook URL, email, etc.)
- isActive

### Incident
- id, monitorId
- startedAt, resolvedAt
- errorMessage
- acknowledgedAt

## API Endpoints

### Auth
- POST /auth/login (GitHub OAuth)
- POST /auth/logout
- GET /auth/me

### Monitors
- GET /monitors
- POST /monitors
- GET /monitors/:id
- PATCH /monitors/:id
- DELETE /monitors/:id
- POST /monitors/:id/pause
- POST /monitors/:id/resume

### Cron Heartbeat
- GET /ping/:monitorId (public, no auth)

### Status Pages
- GET /status-pages (list user pages)
- POST /status-pages
- GET /status/:slug (public)

## UI/UX Design Principles
- Minimal, distraction-free interface
- Mobile-first (Ali's Flutter background influences)
- Dark mode by default (developer-friendly)
- Fast page loads (<100ms TTFB target)
- No feature bloat - every button earns its place

## Pricing (Post-MVP)
- **Free:** 5 monitors, 5min checks, Telegram only
- **Pro ($9/mo):** 20 monitors, 1min checks, all channels, status page
- **Team ($29/mo):** 100 monitors, 1min checks, multiple users, custom domain

## Phase 1 Success Criteria
- Can add HTTP monitor and receive Telegram alert on failure
- Can set up cron heartbeat and get alerted on miss
- Can view status page publicly
- Self-monitoring works (monitor this app with itself)

## Future Features (Post-MVP)
- SMS alerts (Twilio)
- PagerDuty integration
- API access for programmatic control
- Terraform/provider
- Mobile app (Flutter - Ali's specialty!)
- More check regions (multi-location verification)
- Synthetics/browser checks (Playwright)

## Dogfooding Plan
1. Monitor the Pulse app itself (meta!)
2. Replace Ali's dokploy cron with Pulse heartbeat
3. Monitor Ali's other projects (TBYB, etc.)
