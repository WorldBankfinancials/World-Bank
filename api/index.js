// Vercel serverless function for World Bank API
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req;

  // Liu Wei's account data
  const userData = {
    id: 1,
    username: "liu.wei",
    password: "password123",
    fullName: "Liu Wei",
    email: "bankmanagerworld5@gmail.com",
    phone: "+86 138 0013 8000",
    dateOfBirth: "1963-10-17",
    nationality: "China",
    profession: "Marine Engineer",
    company: "Oil Rig Company",
    accountNumber: "4789-6523-1087-9234",
    accountId: "WB-2024-7829",
    pin: "0192",
    totalBalance: 2001382.65,
    isActive: true,
    isVerified: true,
    profileImageUrl: "/api/user/profile-image"
  };

  const accounts = [
    {
      id: 1,
      userId: 1,
      accountNumber: "4789-6523-1087-9234",
      accountType: "checking",
      balance: 1532482.40,
      currency: "USD",
      isActive: true
    },
    {
      id: 2,
      userId: 1,
      accountNumber: "4789-6523-1087-9235",
      accountType: "savings",
      balance: 135000.00,
      currency: "USD",
      isActive: true
    },
    {
      id: 3,
      userId: 1,
      accountNumber: "4789-6523-1087-9236",
      accountType: "investment",
      balance: 363900.25,
      currency: "USD",
      isActive: true
    }
  ];

  const transactions = [
    {
      id: 1,
      accountId: 1,
      type: "credit",
      amount: 50000.00,
      description: "Welcome Bonus",
      category: "bonus",
      date: "2024-12-15T10:00:00Z",
      status: "completed"
    },
    {
      id: 2,
      accountId: 1,
      type: "debit",
      amount: 25.00,
      description: "Account Setup Fee",
      category: "fee",
      date: "2024-12-15T10:05:00Z",
      status: "completed"
    },
    {
      id: 3,
      accountId: 2,
      type: "credit",
      amount: 125000.00,
      description: "Initial Savings Deposit",
      category: "deposit",
      date: "2024-12-15T11:00:00Z",
      status: "completed"
    },
    {
      id: 4,
      accountId: 3,
      type: "credit",
      amount: 348900.25,
      description: "Investment Portfolio Funding",
      category: "investment",
      date: "2024-12-15T12:00:00Z",
      status: "completed"
    }
  ];

  // Route handling
  if (url === '/api/user' && req.method === 'GET') {
    return res.status(200).json(userData);
  }

  if (url === '/api/accounts' && req.method === 'GET') {
    return res.status(200).json(accounts);
  }

  if (url.startsWith('/api/accounts/') && url.includes('/transactions') && req.method === 'GET') {
    const accountId = parseInt(url.split('/')[3]);
    const accountTransactions = transactions.filter(t => t.accountId === accountId);
    return res.status(200).json(accountTransactions);
  }

  if (url === '/api/login' && req.method === 'POST') {
    const { username, password } = req.body || {};
    if (username === userData.username && password === userData.password) {
      return res.status(200).json({ success: true, user: userData });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (url === '/api/verify-pin' && req.method === 'POST') {
    const { pin } = req.body || {};
    if (pin === userData.pin) {
      return res.status(200).json({ success: true });
    }
    return res.status(401).json({ success: false, message: 'Invalid PIN' });
  }

  if (url.startsWith('/api/admin/customers/') && url.includes('/balance') && req.method === 'POST') {
    const { amount, description } = req.body || {};
    const customerId = parseInt(url.split('/')[4]);
    
    if (customerId === 1 && amount) {
      // Update account balance
      const account = accounts.find(a => a.id === 1);
      if (account) {
        account.balance += parseFloat(amount);
        userData.totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        // Add transaction record
        transactions.push({
          id: transactions.length + 1,
          accountId: 1,
          type: amount > 0 ? "credit" : "debit",
          amount: Math.abs(amount),
          description: description || "Admin Balance Update",
          category: "admin",
          date: new Date().toISOString(),
          status: "completed"
        });
        
        return res.status(200).json({ 
          success: true, 
          balance: account.balance,
          totalBalance: userData.totalBalance 
        });
      }
    }
    return res.status(400).json({ success: false, message: 'Invalid request' });
  }

  if (url === '/api/admin/transactions' && req.method === 'GET') {
    return res.status(200).json(transactions);
  }

  if (url === '/api/health' && req.method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Default response
  return res.status(404).json({ error: 'Endpoint not found' });
}