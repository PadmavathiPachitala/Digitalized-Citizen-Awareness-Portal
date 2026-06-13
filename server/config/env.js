import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value, fallback = []) => {
  if (!value) return fallback;
  return value.split(',').map((item) => item.trim()).filter(Boolean);
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  corsOrigins: toList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://127.0.0.1:3000']),
  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: toNumber(process.env.RATE_LIMIT_MAX, 1000)
};

export const isProduction = config.nodeEnv === 'production';
