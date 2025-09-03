# 🏦 World Bank - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Environment Variables Setup in Vercel Dashboard

Go to your Vercel dashboard → Project → Settings → Environment Variables and add:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://icbsxmrmorkdgxtumamu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4cm1yb3JrZGd4dHVtYW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzNTI2MDIsImV4cCI6MjA0MDkyODYwMn0.XqJiGI9zFo_0Wgt3gKPpjjY9X8QdCLWdCG7OVBIgN4A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4cm1yb3JrZGd4dHVtYW11Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTM1MjYwMiwiZXhwIjoyMDQwOTI4NjAyfQ.LGjEFiwZe9g_8j0f_P-vVFIR_N6CKQKwwBbp1L0g7S4

# Production Configuration
NODE_ENV=production
DATABASE_URL=postgresql://...your-supabase-db-url-here...
```

### 2. Build Configuration

The app is configured with `vercel.json` for:
- ✅ Backend API routes (`/api/*` → `server/index.ts`)
- ✅ Frontend static files served from `dist/`
- ✅ SPA routing with fallback to `index.html`

### 3. Deploy Commands

**Option 1: GitHub Integration (Recommended)**
1. Push your code to GitHub
2. Connect GitHub repo to Vercel
3. Deploy automatically on push

**Option 2: Manual Deploy**
```bash
npm install -g vercel
vercel --prod
```

## 🔧 Production-Ready Features

✅ **Real Supabase Integration** - Connected to live database
✅ **Authentication System** - Supabase Auth working
✅ **Banking Operations** - Real account balances and transfers
✅ **Real-time Sync** - Live updates from Supabase
✅ **Multi-Account Support** - Checking, Savings, Investment, Business accounts
✅ **PIN Security** - Transaction PIN validation (0192)
✅ **Admin Controls** - Supabase service role for backend operations

## 📊 Live Database Status

**Production Database**: Supabase PostgreSQL
- 🏦 Wei Liu profile: $98,251.25 total balance
- 💳 4 active accounts (Checking, Savings, Investment, Business)
- 🔐 PIN validation: 0192
- 🔄 Real-time subscriptions active

## 🌐 Environment Variables for Vercel

**CRITICAL**: Add these exact environment variables in Vercel:

1. **VITE_SUPABASE_URL** = `https://icbsxmrmorkdgxtumamu.supabase.co`
2. **VITE_SUPABASE_ANON_KEY** = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon key)
3. **SUPABASE_SERVICE_ROLE_KEY** = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (service key)

The **SUPABASE_SERVICE_ROLE_KEY** is essential for:
- ✅ Backend database operations
- ✅ Admin user management
- ✅ Real-time synchronization
- ✅ Transaction processing

## 📱 Expected Live Site Features

After deployment, your site will have:
- ✅ Real user authentication with Supabase
- ✅ Live bank account balances
- ✅ Working money transfers with PIN validation
- ✅ Real-time balance updates
- ✅ Multi-language support (English/Chinese)
- ✅ Responsive mobile-first design

## ⚠️ Troubleshooting

**Issue**: Site not loading
**Solution**: Check environment variables are added correctly in Vercel Dashboard

**Issue**: Database not connecting
**Solution**: Verify SUPABASE_SERVICE_ROLE_KEY is set in production

**Issue**: Real-time not working
**Solution**: Ensure all 3 Supabase environment variables are configured

## 🎯 Deployment Verification

After deployment, test:
1. ✅ Login with `vaa33053@gmail.com`
2. ✅ View bank account balances
3. ✅ Attempt a money transfer (PIN: 0192)
4. ✅ Check real-time balance updates

Your World Bank application is production-ready for Vercel deployment!