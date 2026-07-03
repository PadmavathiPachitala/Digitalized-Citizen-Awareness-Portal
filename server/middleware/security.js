import cors from 'cors';
import { config, isProduction } from '../config/env.js';
import { ApiError } from '../utils/api.js';

const buckets = new Map();

export const securityHeaders = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
};

export const corsMiddleware = (req, res, next) => {
  const corsOptions = {
    origin(origin, callback) {
      if (!origin || !isProduction || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname === req.hostname) {
          return callback(null, true);
        }
      } catch (err) {
        // Ignore invalid URL formats in Origin header
      }
      return callback(new ApiError(403, 'Origin is not allowed by CORS policy.'));
    }
  };
  cors(corsOptions)(req, res, next);
};

export const rateLimiter = (req, _res, next) => {
  // Bypass rate limiting entirely during local development
  if (!isProduction) {
    return next();
  }

  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = buckets.get(key) || { count: 0, resetAt: now + config.rateLimitWindowMs };

  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + config.rateLimitWindowMs;
  }

  current.count += 1;
  buckets.set(key, current);

  if (current.count > config.rateLimitMax) {
    return next(new ApiError(429, 'Too many requests. Please try again later.'));
  }

  next();
};
