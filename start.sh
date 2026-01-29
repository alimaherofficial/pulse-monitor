#!/bin/sh

# Pulse Monitor Startup Script
# Runs database migrations and starts the application

echo "Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "Migration failed!"
  exit 1
fi

echo "Starting Pulse Monitor..."
exec node dist/main
