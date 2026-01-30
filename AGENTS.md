# Pulse Monitor - Agent Guide

This document provides essential information for AI coding agents working on the Pulse Monitor project.

## Project Overview

Pulse Monitor is a modern, open-source monitoring SaaS for websites, APIs, and services. It supports HTTP/HTTPS monitoring, SSL certificate tracking, and Cron job heartbeat monitoring with real-time alerts via Telegram.

**Key Features:**
- HTTP/HTTPS endpoint monitoring with custom status codes and keyword matching
- Cron job heartbeat monitoring (ping-based)
- SSL certificate expiry monitoring
- Telegram alerts with intelligent throttling
- Public status pages
- GitHub OAuth authentication
- RESTful API with Swagger documentation

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   NestJS    │────▶│   Prisma    │
│  Frontend   │     │   Backend   │     │   ORM       │
│   (3001)    │     │   (3000)    │     │             │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │              ┌────┴────┐              │
       └─────────────▶│ BullMQ  │◀─────────────┘
                      │ Queues  │
                      └────┬────┘
                      ┌────┴────┐
                      │  Redis  │
                      └─────────┘
```

### Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS 11 + TypeScript 5 |
| Frontend | Next.js 14 + React 18 + Tailwind CSS |
| Mobile App | Flutter (planned) |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Queue | BullMQ 5 + Redis 7 |
| Auth | Passport.js + GitHub OAuth + JWT |
| Alerts | Telegram Bot API |
| Testing | Jest 30 + Supertest |
| Linting | ESLint 9 + Prettier |

## Project Structure

```
pulse-monitor/
├── src/                          # Backend source code
│   ├── app.module.ts             # Root module
│   ├── main.ts                   # Application entry point
│   ├── common/                   # Shared utilities
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   └── modules/
│       ├── alerts/               # Alert system (Telegram)
│       ├── auth/                 # Authentication (GitHub OAuth, JWT)
│       ├── dashboard/            # Dashboard statistics
│       ├── http-check/           # HTTP monitoring logic
│       ├── monitors/             # Monitor CRUD & cron heartbeat
│       ├── prisma/               # Database service
│       ├── queue/                # BullMQ job processors
│       └── status-pages/         # Public status pages
├── frontend/                     # Next.js frontend
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── (dashboard)/      # Dashboard routes (authenticated)
│   │   │   ├── login/            # Login page
│   │   │   └── status/[slug]/    # Public status pages
│   │   ├── components/           # React components
│   │   ├── contexts/             # React contexts (Auth)
│   │   └── lib/                  # Utilities & API client
│   ├── package.json
│   └── next.config.mjs
├── mobileapp/                    # Flutter mobile app
│   └── pulse_monitor/
├── prisma/                       # Database schema
│   └── schema.prisma
├── test/                         # E2E tests
├── docker-compose.yml            # Local development stack
├── Dockerfile                    # Backend production image
└── railway.json / render.yaml    # Deployment configs
```

## Backend Modules

### Auth Module (`src/modules/auth/`)
- **GitHub OAuth**: `github.strategy.ts` - Passport strategy for GitHub OAuth
- **JWT Strategy**: `jwt.strategy.ts` - JWT token validation
- **Auth Flow**: User authenticates via GitHub → receives access + refresh tokens
- **Routes**:
  - `GET /auth/github` - Initiate OAuth
  - `GET /auth/github/callback` - OAuth callback
  - `POST /auth/refresh` - Refresh tokens
  - `GET /auth/me` - Get current user

### Monitors Module (`src/modules/monitors/`)
- **Types**: `http`, `cron`, `ssl` (ssl partially implemented)
- **Cron Heartbeat**: Public `GET /ping/:monitorId` endpoint for cron jobs to ping
- **Routes**:
  - CRUD operations for monitors
  - `POST /monitors/:id/pause` / `resume`
  - `GET /monitors/:id/checks` - List check results
  - `GET /monitors/:id/incidents` - List incidents

### Queue Module (`src/modules/queue/`)
- **BullMQ Integration**: Uses Redis for job queuing
- **Scheduler**: `check-scheduler.service.ts` - Schedules recurring checks
- **Processors**:
  - `http-check.processor.ts` - Performs HTTP checks
  - `cron-check.processor.ts` - Validates cron heartbeat pings
- **Job Scheduling**: Repeating jobs based on monitor interval (HTTP) or grace period (cron)

### Alerts Module (`src/modules/alerts/`)
- **Telegram**: `telegram.service.ts` - Bot integration
- **Throttling**: Alerts throttled to prevent spam (default: 15 minutes between down alerts)
- **Channel Types**: Telegram (implemented), Discord, Slack, Email (planned)
- **Fallback**: Uses user's `telegramChatId` if no alert channels configured

### Status Pages Module (`src/modules/status-pages/`)
- **Public Endpoint**: `GET /status/:slug` - No authentication required
- **Private Endpoints**: CRUD operations under `/status-pages` (authenticated)

## Database Schema (Prisma)

Key models:
- **User**: `id`, `email`, `name`, `avatar`, `telegramChatId`, `plan`
- **Monitor**: `id`, `userId`, `name`, `type` (http/cron/ssl), `config` (JSON), `interval`, `gracePeriod`, `isPaused`
- **CheckResult**: `id`, `monitorId`, `status` (up/down/unknown), `responseTime`, `httpStatusCode`, `checkedAt`
- **AlertChannel**: `id`, `monitorId`, `type`, `config` (JSON), `isActive`
- **Incident**: `id`, `monitorId`, `startedAt`, `resolvedAt`, `errorMessage`
- **StatusPage**: `id`, `userId`, `slug`, `title`, `monitors[]`

## Environment Variables

### Required

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/pulse_monitor"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate: openssl rand -base64 32)
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

### Optional

```bash
# Telegram Bot (for alerts)
TELEGRAM_BOT_TOKEN="your_bot_token"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3001"
APP_URL="http://localhost:3000"
PORT=3000
```

### Frontend Environment Variables

```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_GITHUB_CLIENT_ID="your_github_client_id"
```

## Build and Development Commands

### Backend

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database migrations
npx prisma migrate dev      # Development
npx prisma migrate deploy   # Production
npx prisma generate         # Generate client

# Linting and formatting
npm run lint
npm run format
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

### Docker Compose (Full Stack)

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e
```

Test files:
- Unit: `src/**/*.spec.ts`
- E2E: `test/*.e2e-spec.ts`

## Code Style Guidelines

### TypeScript

- **Strict mode enabled**: `strict: true` in tsconfig.json
- **Explicit types**: Prefer explicit return types on public APIs
- **No `any`**: Avoid `any` type (configured as warning in ESLint)
- **Path aliases**: Use `@/*` for imports from `src/`:
  - `@modules/*` → `src/modules/*`
  - `@common/*` → `src/common/*`

### Formatting (Prettier)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100
}
```

### ESLint Rules

- `@typescript-eslint/no-unused-vars`: Error (except underscore prefix)
- `@typescript-eslint/no-explicit-any`: Off (allowed for flexibility)
- `@typescript-eslint/no-floating-promises`: Warn

### NestJS Conventions

- **Decorators**: Use PascalCase for class decorators
- **Controllers**: Suffix with `Controller`, use `@Controller('route')`
- **Services**: Suffix with `Service`, use `@Injectable()`
- **DTOs**: Use `class-validator` decorators for validation
- **Guards**: Implement `CanActivate` interface for auth guards

## Security Considerations

1. **JWT Secrets**: Must be at least 32 characters, use `openssl rand -base64 32`
2. **CORS**: Configured in `main.ts` with `APP_URL` origin
3. **Validation**: Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`
4. **Authentication**: All routes protected by default; use `@Public()` decorator (if implemented) for public routes
5. **Database**: Prisma handles SQL injection prevention
6. **Secrets**: Never commit `.env` files; use `.env.example` as template

## Deployment

### Docker

Multi-stage Dockerfile for backend:
1. **Builder stage**: Compile TypeScript
2. **Production stage**: Run with minimal dependencies, non-root user

### Railway

Uses `railway.json`:
```json
{
  "build": { "builder": "DOCKERFILE" },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node dist/main",
    "healthcheckPath": "/health"
  }
}
```

### Render

Uses `render.yaml` blueprint for infrastructure-as-code deployment.

### Startup Process

1. Run database migrations: `npx prisma migrate deploy`
2. Initialize monitor schedules: `CheckSchedulerService.initializeSchedules()`
3. Start HTTP server on `PORT` (default: 3000)
4. Health check endpoint: `GET /health`

## Common Tasks

### Adding a New Monitor Type

1. Update `MonitorType` enum in `prisma/schema.prisma`
2. Add type-specific config interface in `src/modules/http-check/interfaces/`
3. Update `CheckSchedulerService.scheduleMonitor()` with new logic
4. Create processor in `src/modules/queue/processors/`
5. Run migration: `npx prisma migrate dev`

### Adding Alert Channels

1. Update `AlertType` enum in schema
2. Implement service method in `alerts.service.ts`
3. Add UI components in frontend
4. Run migration

### Database Changes

```bash
# After modifying schema.prisma
npx prisma migrate dev --name descriptive_name
npx prisma generate
```

## API Documentation

When backend is running, visit `/api` for Swagger/OpenAPI documentation.

Key endpoints:
- `/auth/*` - Authentication
- `/monitors` - Monitor CRUD
- `/status-pages` - Status page management
- `/dashboard/stats` - Dashboard statistics
- `/health` - Health check

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# or
docker-compose ps

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check Redis
redis-cli ping
# Should return PONG
```

### Migration Failures

```bash
# Reset (WARNING: deletes data!)
npx prisma migrate reset

# Mark as applied
npx prisma migrate resolve --applied migration_name
```

## File Locations Summary

| Purpose | Location |
|---------|----------|
| Backend entry | `src/main.ts` |
| Root module | `src/app.module.ts` |
| Database schema | `prisma/schema.prisma` |
| Environment config | `.env` (create from `.env.example`) |
| Frontend entry | `frontend/src/app/layout.tsx` |
| Frontend API client | `frontend/src/lib/api.ts` |
| E2E tests | `test/app.e2e-spec.ts` |
| Docker compose | `docker-compose.yml` |
| Backend Dockerfile | `Dockerfile` |
| Frontend Dockerfile | `frontend/Dockerfile` |
