import express from 'express';
import { asyncHandler } from '../utils/api.js';
import { listFaqs } from '../services/contentService.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const faqs = await listFaqs(req.supabase);
  res.json({ faqs });
}));

export default router;
