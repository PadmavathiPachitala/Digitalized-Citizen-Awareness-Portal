import express from 'express';
import { asyncHandler } from '../utils/api.js';
import { listDocuments } from '../services/contentService.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const documents = await listDocuments(req.supabase);
  res.json({ documents });
}));

export default router;
