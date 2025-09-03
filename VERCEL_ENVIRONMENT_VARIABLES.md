# 🌐 VERCEL ENVIRONMENT VARIABLES CONFIGURATION

## 🚀 How to Add Variables to Vercel

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **World Bank** project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the sidebar

### Step 2: Add Each Variable
Click **Add** and enter each variable below:

## 📋 REQUIRED ENVIRONMENT VARIABLES

### Frontend Variables (VITE_ prefix for client-side)
```
Name: VITE_SUPABASE_URL
Value: https://icbsxmrmorkdgxtumamu.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Name: VITE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4bXJtb3JrZGd4dHVtYW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTkxMDksImV4cCI6MjA3MDMzNTEwOX0.GDBjj7flp-6sLjfHh3mil31zPq_97Tvfw47Oz5KxKqk
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Name: VITE_APP_TITLE
Value: World Bank Digital Banking
Environments: ✅ Production ✅ Preview ✅ Development
```

### Backend Variables (Server-side only)
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4bXJtb3JrZGd4dHVtYW11Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc1OTEwOSwiZXhwIjoyMDcwMzM1MTA5fQ.flfRMxdMFOQXqfdjGxSUWKSHsimTM0FSy-b2ZZda5HU
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Name: SUPABASE_DATABASE_URL
Value: https://icbsxmrmorkdgxtumamu.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Name: NODE_ENV
Value: production
Environments: ✅ Production only
```

## 🔐 SECURITY NOTES

### Safe to Expose (VITE_ prefix)
- `VITE_SUPABASE_URL` - Public project URL
- `VITE_SUPABASE_ANON_KEY` - Public anonymous key (Row Level Security protects data)
- `VITE_APP_TITLE` - Application title

### Server-side Only (No VITE_ prefix)  
- `SUPABASE_SERVICE_ROLE_KEY` - Admin operations only, never exposed to client
- `SUPABASE_DATABASE_URL` - Server-side database connection
- `NODE_ENV` - Server environment configuration

## 📖 Variable Explanations

### VITE_SUPABASE_URL
- **Purpose**: Your Supabase project URL for client connections
- **Current Value**: `https://icbsxmrmorkdgxtumamu.supabase.co`
- **Usage**: Frontend authentication and API calls

### VITE_SUPABASE_ANON_KEY
- **Purpose**: Public key for client-side Supabase operations
- **Security**: Protected by Row Level Security (RLS) policies
- **Usage**: User authentication, reading user's own data

### SUPABASE_SERVICE_ROLE_KEY
- **Purpose**: Admin operations with full database access
- **Security**: Server-side only, bypasses RLS when needed
- **Usage**: Admin approval workflow, system operations

### SUPABASE_DATABASE_URL
- **Purpose**: Direct database connection for server operations
- **Usage**: Real-time subscriptions, admin functions

## ✅ VERIFICATION

After adding variables, your Vercel environment should show:
- **6 total variables** configured
- **Production, Preview, Development** environments selected for each
- **All values** properly copied without extra spaces

## 🚨 IMPORTANT REMINDERS

1. **Copy Exactly**: Ensure no extra spaces or characters in values
2. **All Environments**: Select Production, Preview, and Development for each variable
3. **VITE_ Prefix**: Required for client-side variables in Vite applications
4. **Service Role Security**: Never expose service role key to client-side code

Your World Bank application will have full Supabase integration with these variables configured in Vercel.