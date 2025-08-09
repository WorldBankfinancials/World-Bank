# Supabase Real-Time Configuration

## Step 1: Enable Real-Time Features
After running the database setup, you need to enable real-time for specific tables.

### Go to Supabase Dashboard
1. Open your project dashboard
2. Go to **Settings** → **API** → **Real-time**
3. Enable real-time for these tables:

#### Enable Real-time for:
```
✅ messages       (for live chat)
✅ alerts         (for notifications) 
✅ transactions   (for live transaction updates)
✅ user_profiles  (for profile changes)
✅ bank_accounts  (for balance updates)
```

## Step 2: Real-Time Subscriptions (Already Built)
Your app already has real-time subscriptions configured in:
- `client/src/components/RealtimeAlerts.tsx` - Live notifications
- `client/src/components/LiveChat.tsx` - Real-time chat

## Step 3: Test Real-Time Features
Once enabled, you can test:

### Live Notifications
```sql
-- Run this in SQL Editor to test alerts
INSERT INTO public.alerts (user_id, title, message, type) VALUES 
('your-user-id-here', 'Test Alert', 'Real-time is working!', 'info');
```

### Live Chat Messages
```sql
-- Test chat messages
INSERT INTO public.messages (sender_id, sender_name, sender_role, message) VALUES 
('your-user-id-here', 'Support Agent', 'admin', 'Welcome to World Bank support!');
```

### Live Balance Updates
```sql
-- Test balance changes
UPDATE public.bank_accounts 
SET balance = balance + 100.00 
WHERE user_id = 'your-user-id-here';
```

## Step 4: Row Level Security
All tables have proper RLS policies:
- Users can only see their own data
- Messages are publicly readable (for chat)
- Admins can manage all data

## Step 5: Auto-Generated Data
The database automatically generates:
- Account numbers: `WB1234567890`
- IBANs: `US12WRLD1234567890123456`
- Transaction references: `TXN20250109123456`
- Masked card numbers: `****-****-****-1234`

Your banking system is now fully functional with real-time capabilities!