#!/bin/bash
set -e

# Fix permissions first (using sudo since node user needs root for chown)
echo "🔧 Fixing workspace permissions..."
sudo chown -R node:node /workspace 2>/dev/null || true
sudo chmod -R u+w /workspace/node_modules 2>/dev/null || true

echo "🚀 Setting up development environment..."

# Step 1: Setup environment file
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from .env.example..."
  cp .env.example .env.local

  # Update DATABASE_URL to use 'db' hostname (docker-compose service name)
  sed -i 's/DATABASE_URL=postgresql:\/\/username:password@localhost:5432\/database/DATABASE_URL=postgresql:\/\/username:password@db:5432\/database/' .env.local

  # Ensure USE_MOCK_PAYMENT is true for development
  if grep -q "USE_MOCK_PAYMENT=false" .env.local; then
    sed -i 's/USE_MOCK_PAYMENT=false/USE_MOCK_PAYMENT=true/' .env.local
  fi

  echo "✅ .env.local created with development defaults"
else
  echo "✅ .env.local already exists"
fi

# Step 2: Clean up node_modules volume (keep lock file for reproducibility)
echo "🧹 Cleaning incompatible bindings from node_modules volume..."
sudo rm -rf node_modules 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

# Step 3: Install dependencies using lock file (reproduces production exactly)
echo "📦 Installing dependencies from lock file..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Step 3: Wait for PostgreSQL to be ready
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
  sleep 1
done
echo "✅ PostgreSQL is ready"

# Step 4: Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate || echo "⚠️  Database migrations failed or already applied"

# Optional: Uncomment the line below to seed the database on first setup
# echo "🌱 Seeding database..."
# npm run db:seed || echo "⚠️  Database seeding failed or already applied"

echo ""
echo "✨ Development environment ready!"
echo ""
echo "Next steps:"
echo "  • npm run dev           - Start Next.js development server"
echo "  • npm run worker        - Start background job worker"
echo "  • npm run lint          - Run ESLint"
echo "  • npm run format        - Format code with Prettier"
echo "  • npm test              - Run tests with Vitest"
echo ""
