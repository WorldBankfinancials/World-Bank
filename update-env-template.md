# Update Your Environment Configuration

## Step 1: Get Your New Supabase Credentials
From your new Supabase project:

1. **Go to Settings → API in your Supabase dashboard**
2. **Copy these values:**
   - Project URL
   - anon/public key  
   - service_role key (for admin operations)

## Step 2: Update Your .env File
Replace the values in your `.env` file:

```env
# Supabase Configuration - UPDATE THESE VALUES
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Keep these existing values
NODE_ENV=development
VITE_APP_TITLE="World Bank Digital Banking"
```

## Step 3: Example Values
Your new values should look like:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Restart Your Application
After updating the `.env` file, the application will automatically restart and connect to your new Supabase project.

## Step 5: Test Authentication
Once connected, you can:
1. Register new users with real email/password
2. Login with Supabase authentication
3. Access the banking features with UUIDs
4. Use real-time chat and notifications

Your World Bank application will now use authentic Supabase data instead of mock components!