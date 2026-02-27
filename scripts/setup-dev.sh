#!/bin/bash
# TaskFlow Development Setup Script
# Run this once to set up the local database and seed data.

set -e

echo "=== TaskFlow Dev Setup ==="
echo ""

# 1. Check if PostgreSQL is running
echo "1. Checking PostgreSQL..."
if ! pg_isready -h localhost > /dev/null 2>&1; then
  echo "   Starting PostgreSQL..."
  sudo pg_ctlcluster 16 main start 2>/dev/null || {
    echo "   ERROR: Could not start PostgreSQL. Is it installed?"
    exit 1
  }
fi
echo "   PostgreSQL is running."

# 2. Create database and user if needed
echo "2. Setting up database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='taskflow'" 2>/dev/null | grep -q 1 || {
  echo "   Creating user 'taskflow'..."
  sudo -u postgres psql -c "CREATE USER taskflow WITH PASSWORD 'taskflow' CREATEDB;" 2>/dev/null
}
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='taskflow'" 2>/dev/null | grep -q 1 || {
  echo "   Creating database 'taskflow'..."
  sudo -u postgres psql -c "CREATE DATABASE taskflow OWNER taskflow;" 2>/dev/null
}
echo "   Database ready."

# 3. Create .env if it doesn't exist
echo "3. Checking .env file..."
if [ ! -f .env ]; then
  cat > .env << 'ENVFILE'
# ─── Database (Local PostgreSQL for development) ────────────────────────────────
DATABASE_URL="postgresql://taskflow:taskflow@localhost:5432/taskflow"

# ─── Session ────────────────────────────────────────────────────────────────────
SESSION_SECRET="dev-secret-change-me-in-production-32chars"

# ─── Application ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENVFILE
  echo "   Created .env file."
else
  echo "   .env already exists."
fi

# 4. Install dependencies
echo "4. Installing dependencies..."
npm install --silent 2>/dev/null

# 5. Generate Prisma client
echo "5. Generating Prisma client..."
npx prisma generate 2>/dev/null

# 6. Run migrations
echo "6. Running database migrations..."
npx prisma db push --skip-generate 2>/dev/null
echo "   Migrations applied."

# 7. Seed the dev user
echo "7. Seeding dev user..."
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const hash = await bcrypt.hash('password123', 12);
  await prisma.user.upsert({
    where: { email: 'sarah@fletcherdesign.co' },
    update: { passwordHash: hash },
    create: {
      id: 'dev_user_1',
      email: 'sarah@fletcherdesign.co',
      name: 'Sarah Fletcher',
      passwordHash: hash,
      emailVerified: true,
      timezone: 'America/New_York',
    },
  });
  await prisma.\$disconnect();
  console.log('   Dev user ready.');
}
seed().catch(e => { console.error('   Seed error:', e.message); process.exit(1); });
" 2>&1

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Login credentials:"
echo "  Email:    sarah@fletcherdesign.co"
echo "  Password: password123"
echo ""
echo "Start the dev server with: npm run dev"
