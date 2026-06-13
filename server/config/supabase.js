import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let supabase = null;

export function getSupabase() {
  if (supabase) return supabase;

  if (!config.supabaseUrl || !config.supabaseKey) {
    logger.warn('Supabase environment variables are missing.');
    return null;
  }

  supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false }
  });

  return supabase;
}
