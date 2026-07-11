import { Router } from 'express';

const router = Router();

// Endpoint to provide Supabase config to frontend at runtime
router.get('/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  });
});

export default router;
