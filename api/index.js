
// Vercel serverless function for World Bank API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Basic health check
  if (req.url === '/api/health') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'World Bank API is running on Vercel',
      timestamp: new Date().toISOString()
    });
  }

  // Handle login endpoint
  if (req.url === '/api/login' && req.method === 'POST') {
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

  // Handle other API endpoints
  if (req.url.startsWith('/api/')) {
    return res.status(501).json({ 
      error: 'API endpoint not implemented for serverless deployment',
      endpoint: req.url,
      method: req.method
    });
  }

  // Default response
  res.status(404).json({ error: 'API endpoint not found' });
}
