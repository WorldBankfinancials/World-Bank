
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
          accountNumber: 'WB-2024-001',
          isVerified: true
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Handle user endpoint
  if (apiPath === '/user' && req.method === 'GET') {
    return res.status(200).json({
      id: 1,
      username: 'liu.wei',
      fullName: 'Liu Wei',
      email: 'bankmanagerworld5@gmail.com',
      accountNumber: 'WB-2024-001',
      isVerified: true,
      balance: 2001382.65
    });
  }

  // Handle accounts endpoint
  if (apiPath === '/accounts' && req.method === 'GET') {
    return res.status(200).json([
      {
        userId: 1,
        accountNumber: '4789-6523-1087-9234',
        accountType: 'checking',
        balance: 2001382.65,
        currency: 'USD',
        isActive: true
      },
      {
        userId: 1,
        accountNumber: '4789-6523-1087-5678',
        accountType: 'savings',
        balance: 150000.00,
        currency: 'USD',
        isActive: true
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
