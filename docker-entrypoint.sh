#!/bin/sh
set -e

export DATABASE_URL="file:/data/dev.db"
mkdir -p /data /app/packages/db/prisma
ln -sf /data/dev.db /app/packages/db/prisma/dev.db

cd /app
npm run db:generate

if [ ! -s /data/dev.db ]; then
  echo "Initializing database..."
  npm run db:push --workspace=packages/db
  npm run db:seed --workspace=packages/db || true
else
  npm run db:push --workspace=packages/db || true
fi

exec "$@"
