#!/bin/bash
set -e

echo "🚀 Setting up development environment..."

# Step 1: Setup environment file
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from .env.example..."

  if [ ! -f .env.example ]; then
    echo "❌ .env.example not found! Cannot create .env.local"
    exit 1
  fi

  cp .env.example .env.local

  if grep -q "localhost:5432" .env.local; then
    sed -i 's/localhost:5432/db:5432/' .env.local
  fi

  if grep -q "USE_MOCK_PAYMENT=false" .env.local; then
    sed -i 's/USE_MOCK_PAYMENT=false/USE_MOCK_PAYMENT=true/' .env.local
  fi

  echo "✅ .env.local created with development defaults"
else
  echo "✅ .env.local already exists"
fi

# Step 2: Install dependencies fresh in container
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Step 3: Check for security vulnerabilities
echo "🔒 Checking for security vulnerabilities..."
npm audit fix --legacy-peer-deps || echo "⚠️  Some vulnerabilities couldn't be auto-fixed"

# Step 4: Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

until pg_isready -h db -U username -d database >/dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "❌ PostgreSQL failed to start after $MAX_ATTEMPTS attempts"
    exit 1
  fi
  echo "  Waiting... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Step 5: Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate || echo "⚠️  Database migrations failed or already applied"

echo ""
echo "✨ Development environment ready!"
echo ""
echo "🎯 Run 'npm run dev' to start the Next.js development server"
echo ""