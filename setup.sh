#!/bin/bash
# =========================================================
# Full Project Setup + Auto Dev Launch for World-Bank
# =========================================================

set -e  # Stop on any error

echo "1️⃣ Checking out main branch..."
git checkout main

echo "2️⃣ Cleaning old cache and dependencies..."
rm -rf node_modules
rm -f package-lock.json
npm cache clean --force

echo "3️⃣ Installing root dependencies..."
npm install

echo "4️⃣ Installing frontend dependencies..."
cd client
npm install
cd ..

echo "5️⃣ Setting up Husky pre-commit and pre-push hooks..."
npm run prepare

# Pre-push hook to auto-install dependencies if package.json changes
mkdir -p .husky
cat << 'EOF' > .husky/pre-push.sh
#!/bin/sh
if git diff --cached --name-only | grep -E 'package(-lock)?\.json$' >/dev/null; then
  echo "📦 Detected dependency changes — running npm install..."
  npm install || { echo "❌ npm install failed!"; exit 1; }
  echo "✅ Dependencies updated successfully!"
fi
EOF
chmod +x .husky/pre-push.sh

echo "6️⃣ Running ESLint auto-fix and Prettier formatting..."
npm run lint:fix
npm run format

echo "7️⃣ Checking TypeScript compilation..."
npm run check

echo "8️⃣ Pushing Drizzle schema to database (if using Supabase)..."
npm run db:push || echo "⚠️ Drizzle schema push skipped or failed."

echo "9️⃣ Launching backend dev server in background..."
npm run dev &
BACKEND_PID=$!

echo "🔟 Launching frontend dev server..."
cd client
npm run dev &

echo "✅ Setup complete! Both dev servers are running."
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend URL: http://localhost:5173 (default Vite port)"
echo "Use 'kill $BACKEND_PID' to stop backend server if needed."
