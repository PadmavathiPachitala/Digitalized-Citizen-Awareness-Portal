import express from 'express';
import { asyncHandler, slugify, cleanString } from '../utils/api.js';
import { normalizeScheme, listSchemes, getSchemeById } from '../services/schemeService.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const schemes = await listSchemes(req.supabase);
  res.json({ schemes });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = cleanString(req.params.id, 180);
  if (!id) return res.status(400).json({ error: 'Scheme ID is required' });

  const scheme = await getSchemeById(req.supabase, id);
  if (!scheme) return res.status(404).json({ error: 'Scheme not found' });

  const { raw: _raw, ...safe } = scheme;
  res.json({ scheme: safe });
}));

export default router;
