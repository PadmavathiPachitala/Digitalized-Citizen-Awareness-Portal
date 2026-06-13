import express from 'express';
import { asyncHandler } from '../utils/api.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    return res.status(500).json({ status: 'error', message: 'Supabase environment variables are not configured.' });
  }

  const { error } = await req.supabase.from('schemes').select('id').limit(1);

  if (error) {
    return res.status(503).json({ status: 'error', message: 'Supabase connectivity check failed.', details: error.message });
  }

  res.json({ status: 'ok', supabase: 'connected' });
}));

export default router;
