import express from 'express';
import { asyncHandler } from '../utils/api.js';
import { listHelplines } from '../services/contentService.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const helplines = await listHelplines(req.supabase);
  res.json({ helplines });
}));

export default router;
