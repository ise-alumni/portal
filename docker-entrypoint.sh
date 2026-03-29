#!/bin/sh
set -e

echo "Running database migrations..."
node --import tsx server/migrate.ts

echo "Starting server..."
exec node --import tsx server/index.ts
