


// Vercel serverless function for World Bank API
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
  const apiPath = url.replace('/api', '');

  // Basic health check
  if (apiPath === '/health') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'World Bank API is running on Vercel',
      timestamp: new Date().toISOString()
    });
  }

  // Handle login endpoint
  if (apiPath === '/login' && req.method === 'POST') {
    const { username, password } = req.body;
    
    // Basic authentication logic (replace with your actual auth)
    if (username === 'liu.wei' && password === 'password123') {
      return res.status(200).json({
        success: true,
        user: {
          id: 1,
          username: 'liu.wei',
          fullName: 'Liu Wei',
          accountNumber: '4789-6523-1087-9234',
          isVerified: true
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Handle user endpoint - EXACT DATA FROM YOUR REPLIT CONSOLE LOGS
  if (apiPath === '/user' && req.method === 'GET') {
    return res.status(200).json({
      id: 1,
      username: 'liu.wei',
      password: 'password123',
      fullName: 'Liu Wei',
      email: 'bankmanagerworld5@gmail.com',
      phone: '+86 138 0013 8000',
      accountNumber: '4789-6523-1087-9234',
      accountId: 'WB-2024-7829',
      profession: 'Marine Engineer',
      dateOfBirth: '1963-10-17',
      address: 'Beijing Shijingshan',
      city: 'Beijing',
      state: 'Beijing',
      country: 'China',
      postalCode: '100043',
      nationality: 'Chinese',
      annualIncome: '$85,000',
      idType: 'National ID',
      idNumber: '310115198503150123',
      transferPin: '0192',
      role: 'customer',
      isVerified: true,
      isOnline: true,
      isActive: true,
      balance: 2001382.65,
      avatarUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAyKADAAQAAAABAAAAqQAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgAqQDIAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/aAAwDAQACEQMRAD8A/fyiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/2Q==',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Handle accounts endpoint
  if (apiPath === '/accounts' && req.method === 'GET') {
    return res.status(200).json([
      {
        id: 1,
        userId: 1,
        accountNumber: '4789-6523-1087-9234',
        accountType: 'checking',
        accountName: 'Primary Checking Account',
        balance: '1527482.40',
        currency: 'USD',
        isActive: true,
        createdAt: new Date('2024-01-15').toISOString()
      },
      {
        id: 2,
        userId: 1,
        accountNumber: '4789-6523-1087-5678',
        accountType: 'savings',
        accountName: 'High-Yield Savings',
        balance: '348900.25',
        currency: 'USD',
        isActive: true,
        createdAt: new Date('2024-01-15').toISOString()
      },
      {
        id: 3,
        userId: 1,
        accountNumber: '4789-6523-1087-9236',
        accountType: 'investment',
        accountName: 'Investment Portfolio',
        balance: '125000.00',
        currency: 'USD',
        isActive: true,
        createdAt: new Date('2024-01-15').toISOString()
      }
    ]);
  }

  // Handle PIN verification endpoint
  if (apiPath === '/verify-pin' && req.method === 'POST') {
    const { username, pin } = req.body;
    
    // For Liu Wei account - using correct PIN from console logs
    if ((username === 'bankmanagerworld5@gmail.com' || username === 'liu.wei') && pin === '0192') {
      return res.status(200).json({
        success: true,
        verified: true,
        message: 'PIN verified successfully'
      });
    }
    
    return res.status(400).json({
      success: false,
      verified: false,
      message: 'Invalid PIN'
    });
  }

  // Handle transaction history endpoints
  if (apiPath === '/accounts/1/transactions' && req.method === 'GET') {
    return res.status(200).json([
      {
        id: 1,
        accountId: 1,
        type: 'credit',
        amount: '125000.00',
        description: 'Wire Transfer Received - Marine Engineering Contract',
        category: 'transfer',
        date: new Date('2024-12-15T10:30:00').toISOString(),
        status: 'completed',
        createdAt: new Date('2024-12-15T10:30:00').toISOString()
      },
      {
        id: 2,
        accountId: 1,
        type: 'debit',
        amount: '89500.00',
        description: 'International Transfer',
        category: 'transfer',
        date: new Date('2024-12-13T16:45:00').toISOString(),
        status: 'completed',
        createdAt: new Date('2024-12-13T16:45:00').toISOString()
      },
      {
        id: 3,
        accountId: 1,
        type: 'credit',
        amount: '5250.00',
        description: 'Monthly Salary Payment',
        category: 'salary',
        date: new Date('2024-12-15T08:00:00').toISOString(),
        status: 'completed',
        createdAt: new Date('2024-12-15T08:00:00').toISOString()
      }
    ]);
  }

  // Handle recent transactions endpoint
  if (apiPath === '/transactions/recent' && req.method === 'GET') {
    return res.status(200).json([
      {
        id: 1,
        accountId: 1,
        type: 'credit',
        amount: '125000.00',
        description: 'Wire Transfer Received - Marine Engineering Contract Payment',
        category: 'salary',
        date: new Date('2024-12-15T10:30:00').toISOString(),
        status: 'completed',
        accountName: 'Primary Checking Account',
        accountType: 'checking',
        createdAt: new Date('2024-12-15T10:30:00').toISOString()
      },
      {
        id: 2,
        accountId: 1,
        type: 'credit',
        amount: '5250.00',
        description: 'Monthly Salary Payment',
        category: 'salary',
        date: new Date('2024-12-15T08:00:00').toISOString(),
        status: 'completed',
        accountName: 'Primary Checking Account',
        accountType: 'checking',
        createdAt: new Date('2024-12-15T08:00:00').toISOString()
      },
      {
        id: 3,
        accountId: 1,
        type: 'debit',
        amount: '156.78',
        description: 'Grocery Store Purchase',
        category: 'shopping',
        date: new Date('2024-12-14T15:30:00').toISOString(),
        status: 'completed',
        accountName: 'Primary Checking Account',
        accountType: 'checking',
        createdAt: new Date('2024-12-14T15:30:00').toISOString()
      },
      {
        id: 4,
        accountId: 3,
        type: 'credit',
        amount: '45230.78',
        description: 'Investment Portfolio Dividend',
        category: 'investment',
        date: new Date('2024-12-13T12:00:00').toISOString(),
        status: 'completed',
        accountName: 'Investment Portfolio',
        accountType: 'investment',
        createdAt: new Date('2024-12-13T12:00:00').toISOString()
      },
      {
        id: 5,
        accountId: 2,
        type: 'credit',
        amount: '1250.00',
        description: 'Savings Interest Payment',
        category: 'interest',
        date: new Date('2024-12-12T09:00:00').toISOString(),
        status: 'completed',
        accountName: 'High-Yield Savings',
        accountType: 'savings',
        createdAt: new Date('2024-12-12T09:00:00').toISOString()
      }
    ]);
  }

  // Handle other API endpoints
  if (apiPath.startsWith('/')) {
    return res.status(501).json({ 
      error: 'API endpoint not implemented for serverless deployment',
      endpoint: apiPath,
      method: req.method
    });
  }

  // Default response
  res.status(404).json({ error: 'API endpoint not found' });
}
