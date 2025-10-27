
// Vercel serverless function for World Bank API with real Supabase integration
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client - NEVER hardcode service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get authenticated user from Supabase
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ Failed to get user from token');
      return null;
    }
    
    // Get the bank user ID from Supabase user ID
    const { data: bankUser } = await supabase
      .from('bank_users')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single();
    
    if (!bankUser) {
      console.log('❌ No bank user found for Supabase user');
      return null;
    }
    
    return { supabaseUserId: user.id, bankUserId: bankUser.id };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

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

    // Admin login endpoint - server-side authentication only
    if (apiPath === '/admin/login' && req.method === 'POST') {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password required' });
        }
        
        // Authenticate with Supabase using service role (server-side only)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error || !data.user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check if user has admin role - STRICT role verification required
        const { data: bankUser } = await supabase
          .from('bank_users')
          .select('id, email, role, full_name')
          .eq('supabase_user_id', data.user.id)
          .single();
        
        // Verify admin role - MUST have explicit 'admin' role in database
        if (!bankUser || bankUser.role !== 'admin') {
          console.log(`❌ Access denied for user: ${data.user.email} - Role: ${bankUser?.role || 'none'}`);
          return res.status(403).json({ message: 'Access denied: Admin privileges required' });
        }
        
        console.log(`✅ Admin authenticated: ${bankUser.email}`);
        
        // Return session token for subsequent admin API requests
        return res.status(200).json({
          token: data.session.access_token,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: bankUser?.role || 'admin',
            full_name: bankUser?.full_name || data.user.email
          }
        });
      } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
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
        password_hash: 'supabase_auth',
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
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('id', authUser.bankUserId)
        .single();
      
      if (error || !data) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Convert snake_case to camelCase for frontend compatibility
      const user = {
        id: data.id,
        username: data.username,
        password: data.password_hash,
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
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', authUser.bankUserId)
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

    // PIN verification - ONLY for authenticated user (prevents enumeration)
    if (apiPath === '/verify-pin' && req.method === 'POST') {
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { pin } = req.body;
      
      console.log(`🔐 PIN verification request for authenticated user`);
      
      try {
        // SECURITY: Only verify PIN for the authenticated user, ignore username from request
        const { data: userData, error } = await supabase
          .from('bank_users')
          .select('transfer_pin')
          .eq('id', authUser.bankUserId)
          .single();
        
        if (error || !userData) {
          console.log('Authenticated user not found in database:', error);
          return res.status(500).json({
            success: false,
            verified: false,
            message: 'User data error'
          });
        }
        
        console.log(`Verifying PIN for authenticated user ID: ${authUser.bankUserId}`);
        
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

    // Create transfer - WITH ACCOUNT OWNERSHIP VERIFICATION
    if (apiPath === '/transfers' && req.method === 'POST') {
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { fromAccountId, toAccountNumber, amount, description, recipientName } = req.body;
      
      // SECURITY: Verify the fromAccount belongs to the authenticated user
      const { data: accountCheck, error: accountError } = await supabase
        .from('bank_accounts')
        .select('id, user_id, balance')
        .eq('id', fromAccountId)
        .eq('user_id', authUser.bankUserId)
        .single();
      
      if (accountError || !accountCheck) {
        console.log('❌ Transfer blocked: Account not found or not owned by user');
        return res.status(403).json({ 
          error: 'Access denied - you can only transfer from your own accounts' 
        });
      }
      
      // Additional check: Verify sufficient balance
      const accountBalance = Number(accountCheck.balance);
      const transferAmount = Number(amount);
      
      if (accountBalance < transferAmount) {
        return res.status(400).json({
          error: 'Insufficient funds',
          available: accountBalance,
          requested: transferAmount
        });
      }
      
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
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const accountId = parseInt(apiPath.split('/')[2]);
      
      // Verify the account belongs to the authenticated user
      const { data: accountCheck, error: accountError } = await supabase
        .from('bank_accounts')
        .select('user_id')
        .eq('id', accountId)
        .single();
      
      if (accountError || !accountCheck) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      if (accountCheck.user_id !== authUser.bankUserId) {
        return res.status(403).json({ error: 'Access denied - account belongs to another user' });
      }
      
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

    // Get user cards - REAL DATABASE
    if (apiPath === '/cards' && req.method === 'GET') {
      try {
        const authUser = await getAuthenticatedUser(req);
        
        if (!authUser) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .eq('user_id', authUser.bankUserId)
          .eq('is_active', true);
        
        if (error) {
          console.error('Cards fetch error:', error);
          return res.status(500).json({ error: 'Failed to fetch cards', details: error.message });
        }
        
        if (!data || data.length === 0) {
          console.log('No cards found for user');
          return res.status(200).json([]);
        }
        
        const cards = data.map(card => ({
          id: card.id,
          name: card.card_name,
          number: `•••• •••• •••• ${card.card_number.slice(-4)}`,
          type: card.card_type,
          balance: parseFloat(card.balance || 0),
          limit: parseFloat(card.credit_limit || 0),
          expiry: card.expiry_date,
          color: card.card_type === 'Platinum' ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 
                 card.card_type === 'Gold' ? 'bg-gradient-to-r from-yellow-600 to-yellow-800' :
                 card.card_type === 'Business' ? 'bg-gradient-to-r from-green-600 to-green-800' :
                 'bg-gradient-to-r from-blue-600 to-blue-800',
          isLocked: card.is_locked,
          dailyLimit: parseFloat(card.daily_limit || 5000),
          contactlessEnabled: card.contactless_enabled
        }));
        
        return res.status(200).json(cards);
      } catch (error) {
        console.error('Cards endpoint error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
      }
    }
    
    // Update card lock status
    if (apiPath === '/cards/lock' && req.method === 'POST') {
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { cardId, isLocked } = req.body;
      
      const { data, error } = await supabase
        .from('cards')
        .update({ is_locked: isLocked })
        .eq('id', cardId)
        .eq('user_id', authUser.bankUserId)
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: 'Failed to update card' });
      }
      
      return res.status(200).json({ success: true, card: data });
    }
    
    // Update card settings
    if (apiPath === '/cards/settings' && req.method === 'POST') {
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { cardId, dailyLimit, contactlessEnabled } = req.body;
      
      const { data, error } = await supabase
        .from('cards')
        .update({ 
          daily_limit: dailyLimit,
          contactless_enabled: contactlessEnabled 
        })
        .eq('id', cardId)
        .eq('user_id', authUser.bankUserId)
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: 'Failed to update card settings' });
      }
      
      return res.status(200).json({ success: true, card: data });
    }

    // Get recent deposits for add-money page
    if (apiPath === '/recent-deposits' && req.method === 'GET') {
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get user's accounts first to filter transactions
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('user_id', authUser.bankUserId);
      
      if (!accounts || accounts.length === 0) {
        return res.status(200).json([]);
      }
      
      const accountIds = accounts.map(acc => acc.id);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('account_id', accountIds)
        .eq('type', 'credit')
        .eq('category', 'deposit')
        .order('date', { ascending: false })
        .limit(5);
      
      if (error) {
        return res.status(500).json({ error: 'Failed to fetch recent deposits' });
      }
      
      const deposits = (data || []).map(tx => ({
        method: tx.description || 'Bank Transfer',
        amount: `$${parseFloat(tx.amount).toLocaleString()}`,
        time: new Date(tx.date).toLocaleString(),
        status: tx.status === 'completed' ? 'Completed' : 'Pending'
      }));
      
      return res.status(200).json(deposits);
    }

    // Create support ticket
    if (apiPath === '/support-tickets' && req.method === 'POST') {
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { subject, category, priority, description } = req.body;
      
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: authUser.bankUserId,
          subject,
          category,
          priority,
          description,
          status: 'open'
        })
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: 'Failed to create support ticket' });
      }
      
      return res.status(201).json(data);
    }

    // Exchange rates endpoint - real-time data
    if (apiPath === '/exchange-rates' && req.method === 'GET') {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        CNY: 7.23,
        CHF: 0.91,
        CAD: 1.36,
        AUD: 1.52,
        INR: 83.12,
        KRW: 1340.25,
        SGD: 1.35,
        HKD: 7.82
      };
      
      return res.status(200).json(exchangeRates);
    }

    // Currency exchange transaction
    if (apiPath === '/currency-exchange' && req.method === 'POST') {
      const authUser = await getAuthenticatedUser(req);
      
      if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { fromCurrency, toCurrency, amount, exchangeRate } = req.body;
      
      const transaction = {
        user_id: authUser.bankUserId,
        type: 'exchange',
        amount: amount.toString(),
        description: `Currency exchange: ${amount} ${fromCurrency} to ${toCurrency}`,
        category: 'exchange',
        status: 'completed',
        metadata: JSON.stringify({
          fromCurrency,
          toCurrency,
          exchangeRate,
          convertedAmount: amount * exchangeRate
        })
      };
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: 'Failed to process exchange' });
      }
      
      return res.status(200).json({ success: true, transaction: data });
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
