// Vercel serverless function for World Bank API with real Supabase integration
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract the API path from the request
  const { url } = req;
  const apiPath = url.replace('/api', '').split('?')[0];

  console.log(`🔗 Vercel API Request: ${req.method} ${apiPath}`);

  try {
    // Health check endpoint
    if (apiPath === '/health') {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'World Bank API is running on Vercel with real Supabase integration',
        timestamp: new Date().toISOString(),
        supabase: supabaseUrl ? 'Connected' : 'Not configured',
        environment: {
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseServiceKey,
          urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
          keyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'missing'
        }
      });
    }

    // Test Supabase connection
    if (apiPath === '/test-supabase-connection') {
      try {
        const { data, error } = await supabase
          .from('bank_users')
          .select('id, full_name, email, balance')
          .limit(5);
        
        if (error) {
          return res.status(500).json({
            connected: false,
            message: 'Banking tables not found in Supabase',
            error: error.message,
            action: 'Please check your Supabase configuration'
          });
        }
        
        return res.status(200).json({
          connected: true,
          message: `Banking tables working! Found ${data?.length || 0} users`,
          users: data,
          details: 'International banking system ready with realtime synchronization'
        });
      } catch (error) {
        return res.status(500).json({ 
          error: 'Connection test failed', 
          details: error.message 
        });
      }
    }

    // Get user by Supabase user ID
    if (apiPath.startsWith('/users/supabase/') && req.method === 'GET') {
      const supabaseUserId = apiPath.split('/')[3];
      
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('supabase_user_id', supabaseUserId)
        .single();
      
      if (error || !data) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json(data);
    }

    // Create Supabase user profile
    if (apiPath === '/users/create-supabase' && req.method === 'POST') {
      const { supabaseUserId, email } = req.body;
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('bank_users')
        .select('*')
        .eq('supabase_user_id', supabaseUserId)
        .single();
      
      if (existingUser) {
        return res.status(200).json(existingUser);
      }
      
      // Create new Wei Liu profile with real banking data
      const newUser = {
        supabase_user_id: supabaseUserId,
        username: email?.split('@')[0] || 'user',
        password: 'supabase_auth',
        full_name: 'Wei Liu',
        email: email || 'vaa33053@gmail.com',
        phone: '+1 (234) 567-8900',
        account_number: '4789-5532-1098-7654',
        account_id: 'WB-2025-8912',
        profession: 'Software Engineer',
        date_of_birth: '1990-05-15',
        address: '123 Tech Street, Suite 100',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        postal_code: '94102',
        nationality: 'American',
        annual_income: '$75,000-$100,000',
        id_type: 'Passport',
        id_number: 'P123456789',
        transfer_pin: '0192',
        role: 'customer',
        is_verified: true,
        is_online: true,
        is_active: true,
        avatar_url: null,
        balance: 15750.5,
        created_by_admin: false,
        modified_by_admin: false,
        admin_notes: null
      };
      
      const { data: createdUser, error } = await supabase
        .from('bank_users')
        .insert(newUser)
        .select()
        .single();
      
      if (error) {
        console.error('Failed to create user profile:', error);
        return res.status(500).json({ error: 'Failed to create user profile' });
      }
      
      return res.status(201).json(createdUser);
    }

    // Get user profile (legacy endpoint)
    if (apiPath === '/user' && req.method === 'GET') {
      // Return the Wei Liu profile from Supabase
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error || !data) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Convert snake_case to camelCase for frontend compatibility
      const user = {
        id: data.id,
        username: data.username,
        password: data.password,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        accountNumber: data.account_number,
        accountId: data.account_id,
        profession: data.profession,
        dateOfBirth: data.date_of_birth,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postal_code,
        nationality: data.nationality,
        annualIncome: data.annual_income,
        idType: data.id_type,
        idNumber: data.id_number,
        transferPin: data.transfer_pin,
        role: data.role,
        isVerified: data.is_verified,
        isOnline: data.is_online,
        isActive: data.is_active,
        avatarUrl: data.avatar_url,
        balance: data.balance,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        supabaseUserId: data.supabase_user_id,
        lastLogin: data.last_login,
        createdByAdmin: data.created_by_admin,
        modifiedByAdmin: data.modified_by_admin,
        adminNotes: data.admin_notes
      };
      
      return res.status(200).json(user);
    }

    // Get bank accounts
    if (apiPath === '/accounts' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', 1)
        .eq('is_active', true);
      
      if (error) {
        return res.status(500).json({ error: 'Failed to fetch accounts' });
      }
      
      // Convert to frontend format
      const accounts = (data || []).map(account => ({
        id: account.id,
        userId: account.user_id,
        accountNumber: account.account_number,
        accountType: account.account_type,
        accountName: account.account_name,
        balance: account.balance.toString(),
        currency: account.currency,
        isActive: account.is_active,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        interestRate: account.interest_rate?.toString() || null,
        minimumBalance: account.minimum_balance?.toString() || null
      }));
      
      return res.status(200).json(accounts);
    }

    // PIN verification
    if (apiPath === '/verify-pin' && req.method === 'POST') {
      const { pin, username } = req.body;
      
      console.log(`🔐 PIN verification request:`, { username, pin });
      
      try {
        // Check the user exists by email, account ID, or mobile
        let userQuery = supabase.from('bank_users').select('transfer_pin, email, username, account_id');
        
        // Handle different login types
        if (username.includes('@')) {
          // Email login
          userQuery = userQuery.eq('email', username);
        } else if (username.startsWith('WB-') || username.startsWith('wb-')) {
          // Account ID login (like WB-2025-8912)
          userQuery = userQuery.eq('account_id', username);
        } else if (username.startsWith('+') || /^\d+$/.test(username)) {
          // Mobile number login
          userQuery = userQuery.eq('phone', username);
        } else {
          // Fallback to username
          userQuery = userQuery.eq('username', username);
        }
        
        const { data: userData, error } = await userQuery.single();
        
        if (error || !userData) {
          console.log('User not found:', { username, error });
          return res.status(401).json({
            success: false,
            verified: false,
            message: 'User not found'
          });
        }
        
        console.log(`Found user PIN: ${userData.transfer_pin}, provided PIN: ${pin}`);
        
        if (userData.transfer_pin === pin) {
          console.log('✅ PIN verification successful');
          return res.status(200).json({
            success: true,
            verified: true,
            message: 'PIN verified successfully'
          });
        } else {
          console.log('❌ PIN mismatch');
          return res.status(401).json({
            success: false,
            verified: false,
            message: 'Invalid PIN'
          });
        }
        
      } catch (supabaseError) {
        console.error('PIN verification error:', supabaseError);
        return res.status(500).json({
          success: false,
          verified: false,
          message: 'Verification failed'
        });
      }
    }

    // Create transfer
    if (apiPath === '/transfers' && req.method === 'POST') {
      const { fromAccountId, toAccountNumber, amount, description, recipientName } = req.body;
      
      const newTransaction = {
        account_id: fromAccountId,
        type: 'debit',
        amount: amount.toString(),
        description: description,
        category: 'transfer',
        date: new Date().toISOString(),
        status: 'pending',
        recipient_name: recipientName,
        admin_notes: null
      };
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTransaction)
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: 'Failed to create transfer' });
      }
      
      return res.status(201).json({
        id: data.id,
        accountId: data.account_id,
        type: data.type,
        amount: data.amount,
        description: data.description,
        status: data.status,
        createdAt: data.created_at
      });
    }

    // Get transactions for account
    if (apiPath.match(/^\/accounts\/\d+\/transactions$/) && req.method === 'GET') {
      const accountId = parseInt(apiPath.split('/')[2]);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('date', { ascending: false })
        .limit(10);
      
      if (error) {
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }
      
      const transactions = (data || []).map(tx => ({
        id: tx.id,
        accountId: tx.account_id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        category: tx.category,
        date: tx.date,
        status: tx.status,
        createdAt: tx.created_at
      }));
      
      return res.status(200).json(transactions);
    }

    // Get user cards
    if (apiPath === '/cards' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', 1)
        .eq('is_active', true);
      
      if (error) {
        return res.status(500).json({ error: 'Failed to fetch cards' });
      }
      
      const cards = (data || []).map(card => ({
        id: card.id,
        name: card.card_name,
        number: card.card_number.replace(/(\d{4})/g, '•••• ').trim().replace(/•{4}$/, card.card_number.slice(-4)),
        type: card.card_type,
        balance: parseFloat(card.balance),
        limit: parseFloat(card.credit_limit),
        expiry: card.expiry_date,
        color: card.card_type === 'Platinum' ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-600 to-blue-800',
        isLocked: card.is_locked,
        dailyLimit: parseFloat(card.daily_limit),
        contactlessEnabled: card.contactless_enabled
      }));
      
      return res.status(200).json(cards);
    }
    
    // Update card lock status
    if (apiPath === '/cards/lock' && req.method === 'POST') {
      const { cardId, isLocked } = req.body;
      
      const { data, error } = await supabase
        .from('cards')
        .update({ is_locked: isLocked })
        .eq('id', cardId)
        .eq('user_id', 1)
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: 'Failed to update card' });
      }
      
      return res.status(200).json({ success: true, card: data });
    }
    
    // Update card settings
    if (apiPath === '/cards/settings' && req.method === 'POST') {
      const { cardId, dailyLimit, contactlessEnabled } = req.body;
      
      const { data, error } = await supabase
        .from('cards')
        .update({ 
          daily_limit: dailyLimit,
          contactless_enabled: contactlessEnabled 
        })
        .eq('id', cardId)
        .eq('user_id', 1)
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: 'Failed to update card settings' });
      }
      
      return res.status(200).json({ success: true, card: data });
    }

    // Default response for unimplemented endpoints
    return res.status(404).json({ 
      error: 'API endpoint not found',
      endpoint: apiPath,
      method: req.method,
      message: 'This endpoint is not implemented in the serverless function'
    });

  } catch (error) {
    console.error('❌ Serverless function error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: 'Check Vercel function logs for more details'
    });
  }
};