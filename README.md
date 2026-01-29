# Pulse Monitor

A modern, open-source monitoring SaaS for websites, APIs, and services. Built with NestJS, Next.js, Prisma, PostgreSQL, and Redis.

![Pulse Monitor](https://img.shields.io/badge/Pulse-Monitor-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Multi-type Monitoring**: HTTP/HTTPS, SSL certificates, Cron jobs
- **Real-time Alerts**: Telegram notifications with throttling
- **Beautiful Dashboard**: Built with Next.js and Tailwind CSS
- **Public Status Pages**: Share your service status with customers
- **GitHub OAuth**: Secure authentication
- **RESTful API**: Full API for all operations
- **Responsive Design**: Works on desktop and mobile

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   NestJS    │────▶│   Prisma    │
│  Frontend   │     │   Backend   │     │   ORM       │
│   (3001)    │     │   (3000)    │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                    │                  │
       │              ┌─────┴─────┐            │
       │              │  BullMQ   │            │
       └─────────────▶│  Queues   │◀───────────┘
                      └─────┬─────┘
                            │
                    ┌───────┴───────┐
                    │     Redis     │
                    └───────────────┘
```

## Quick Start with Docker

The easiest way to run Pulse Monitor is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/alimaherofficial/pulse-monitor.git
cd pulse-monitor

# Copy environment file
cp .env.example .env

# Edit .env with your configuration (GitHub OAuth, etc.)
nano .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000
```

## Manual Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+

### Backend Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database and OAuth credentials

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run start:dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

## GitHub OAuth Setup

1. Go to GitHub Developer Settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Pulse Monitor
   - **Homepage URL**: http://localhost:3001 (or your domain)
   - **Authorization callback URL**: http://localhost:3001/login
4. Copy the Client ID and Client Secret to your `.env` file

## Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/pulse_monitor"

# Redis
REDIS_URL="redis://localhost:6379"

# GitHub OAuth
GITHUB_CLIENT_ID="your_client_id"
GITHUB_CLIENT_SECRET="your_client_secret"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
```

### Optional Environment Variables

```bash
# Telegram Alerts
TELEGRAM_BOT_TOKEN="your_bot_token"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3001"
```

## Deployment

### Railway (Recommended)

1. Fork this repository
2. Create a new project on Railway
3. Connect your GitHub repository
4. Add the required environment variables
5. Deploy!

### Render

1. Fork this repository
2. Create a Blueprint instance on Render using `render.yaml`
3. Add the required environment variables
4. Deploy!

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## API Documentation

Once the backend is running, visit `/api` for Swagger documentation.

### Key Endpoints

- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - OAuth callback
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /monitors` - List all monitors
- `POST /monitors` - Create a new monitor
- `GET /monitors/:id` - Get monitor details
- `POST /monitors/:id/pause` - Pause a monitor
- `POST /monitors/:id/resume` - Resume a monitor
- `GET /status-pages` - List status pages
- `POST /status-pages` - Create a status page

## Screenshots

*Coming soon*

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the maintainer.

---

Built with ❤️ by [Ali Maher](https://github.com/alimaherofficial)
