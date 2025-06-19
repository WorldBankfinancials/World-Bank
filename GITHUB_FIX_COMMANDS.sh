#!/bin/bash
# Execute these commands in Replit Shell to fix the large file GitHub push issue

echo "🔧 Fixing GitHub push - removing large files from git history"

# Method 1: Complete git reset (RECOMMENDED)
echo "Method 1: Resetting git repository..."
rm -rf .git
git init
git remote add origin https://github.com/WorldBankfinancials/World-Bank.git
git add .
git commit -m "Deploy World Bank application - complete banking platform without large files"
git push -u origin main --force

echo "✅ Push complete! Your World Bank application is now on GitHub"
echo "🚀 Ready for Vercel deployment with build settings:"
echo "   Build Command: cd client && npm run build"
echo "   Output Directory: client/dist"
echo "   Install Command: cd client && npm install"