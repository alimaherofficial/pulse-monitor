# Pulse Monitor - Deployment Guide

This guide covers deploying Pulse Monitor to various platforms.

## Table of Contents

- [Docker Deployment](#docker-deployment)
- [Railway Deployment](#railway-deployment)
- [Render Deployment](#render-deployment)
- [Manual Server Deployment](#manual-server-deployment)
- [Environment Variables](#environment-variables)

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/alimaherofficial/pulse-monitor.git
   cd pulse-monitor
   ```

2. **Create environment file**
   ```bash
   cp .env.production.example .env
   ```

3. **Edit `.env` with your values**
   ```bash
   # Required
   JWT_SECRET=$(openssl rand -base64 32)
   JWT_REFRESH_SECRET=$(openssl rand -base64 32)
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # Optional
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ```

4. **Start services**
   ```bash
   docker-compose up -d
   ```

5. **Check logs**
   ```bash
   docker-compose logs -f
   ```

6. **Access application**
   - Frontend: http://localhost:3001
   - Backend: http://localhost:3000
   - API Docs: http://localhost:3000/api

### Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Railway Deployment

### Prerequisites

- Railway CLI (optional)
- GitHub account

### Steps

1. **Fork the repository** to your GitHub account

2. **Create a Railway project**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository

3. **Add PostgreSQL**
   - Click "New" > "Database" > "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

4. **Add Redis**
   - Click "New" > "Database" > "Add Redis"
   - Railway will automatically set `REDIS_URL`

5. **Add environment variables**
   Go to your service variables and add:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   TELEGRAM_BOT_TOKEN=your_bot_token (optional)
   FRONTEND_URL=https://your-frontend-domain.up.railway.app
   ```

6. **Update GitHub OAuth callback URL**
   - Go to GitHub Developer Settings > OAuth Apps
   - Update "Authorization callback URL" to:
     `https://your-backend-domain.up.railway.app/auth/github/callback`

7. **Deploy the backend service**
   Railway will automatically deploy when you push to GitHub

8. **Deploy the frontend service**
   - Create a new service from your GitHub repo
   - Set root directory to `frontend`
   - Add environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-domain.up.railway.app
     NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
     ```

### Using railway.json

The repository includes `railway.json` for deployment configuration:

```json
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node dist/main",
    "healthcheckPath": "/health"
  }
}
```

## Render Deployment

### Using Blueprint

1. **Fork the repository** to your GitHub account

2. **Go to Render Dashboard** and click "New" > "Blueprint"

3. **Connect your GitHub repository**

4. **Configure environment variables**
   Render will create:
   - Web service for backend
   - Web service for frontend
   - PostgreSQL database
   - Redis instance

5. **Update GitHub OAuth**
   - Set callback URL to:
     `https://your-backend-service.onrender.com/auth/github/callback`

6. **Deploy**
   Click "Apply" to start deployment

### Manual Setup

1. **Create PostgreSQL**
   - Dashboard > New > PostgreSQL
   - Note the connection string

2. **Create Redis**
   - Dashboard > New > Redis
   - Note the connection string

3. **Create Web Service (Backend)**
   - Dashboard > New > Web Service
   - Connect your GitHub repo
   - Set environment:
     ```
     NODE_ENV=production
     DATABASE_URL=your_postgres_url
     REDIS_URL=your_redis_url
     JWT_SECRET=your_secret
     JWT_REFRESH_SECRET=your_refresh_secret
     GITHUB_CLIENT_ID=your_client_id
     GITHUB_CLIENT_SECRET=your_client_secret
     ```

4. **Create Web Service (Frontend)**
   - Dashboard > New > Web Service
   - Connect your GitHub repo
   - Set root directory: `frontend`
   - Set environment:
     ```
     NEXT_PUBLIC_API_URL=your_backend_url
     NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
     ```

## Manual Server Deployment

### Prerequisites

- Ubuntu 22.04 LTS (recommended)
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Nginx (optional, for reverse proxy)
- PM2 (for process management)

### Steps

1. **Install dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib

   # Install Redis
   sudo apt install -y redis-server

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Setup PostgreSQL**
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE pulse_monitor;"
   sudo -u postgres psql -c "CREATE USER pulse WITH ENCRYPTED PASSWORD 'your_secure_password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pulse_monitor TO pulse;"
   ```

3. **Setup Redis**
   ```bash
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

4. **Clone and setup application**
   ```bash
   git clone https://github.com/alimaherofficial/pulse-monitor.git
   cd pulse-monitor

   # Backend
   npm install
   npx prisma generate
   npm run build

   # Frontend
   cd frontend
   npm install
   npm run build
   cd ..
   ```

5. **Create environment file**
   ```bash
   cp .env.production.example .env
   # Edit with your production values
   nano .env
   ```

6. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

7. **Start with PM2**
   ```bash
   # Backend
   pm2 start dist/main.js --name pulse-backend

   # Frontend
   pm2 start frontend/node_modules/.bin/next --name pulse-frontend -- start --port 3001

   # Save PM2 config
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx (optional)**
   ```bash
   sudo apt install -y nginx
   ```

   Create `/etc/nginx/sites-available/pulse-monitor`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pulse-monitor /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Setup SSL with Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT signing | Generate with `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Generate with `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app ID | From GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret | From GitHub Developer Settings |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot for alerts | - |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3001` |
| `APP_URL` | Application URL | `http://localhost:3000` |
| `PORT` | Backend port | `3000` |

### Frontend Only

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub OAuth client ID | Same as backend |

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli ping
```

### Migration Failures

```bash
# Reset migrations (careful: this deletes data!)
npx prisma migrate reset

# Or mark as applied
npx prisma migrate resolve --applied migration_name
```

### Check Logs

```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs

# Systemd
journalctl -u pulse-monitor
```

## Security Checklist

- [ ] Use strong JWT secrets (min 32 chars)
- [ ] Enable HTTPS in production
- [ ] Set secure session cookies
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database encryption at rest
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Keep dependencies updated

## Support

For deployment issues, please:
1. Check the logs first
2. Review environment variables
3. Open an issue on GitHub with logs and configuration
