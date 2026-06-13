import { logger } from '../utils/logger.js';

export const notFoundHandler = (req, res) => {
  if (req.accepts('html') && !req.path.startsWith('/api/')) {
    return res.status(404).send(`
      <div style="text-align: center; padding: 50px; font-family: sans-serif;">
        <h2>404 - Page Not Found</h2>
        <p>The page you are looking for does not exist or the link is incorrect.</p>
        <a href="/" style="color: #FF6B00; text-decoration: none; font-weight: bold;">Return to Home</a>
      </div>
    `);
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  const message = status >= 500 ? 'Internal server error' : err.message;

  logger.error(err.message || 'Unhandled error', {
    status,
    method: req.method,
    path: req.path,
    details: err.details || undefined
  });

  res.status(status).json({
    ok: false,
    error: message,
    details: status >= 500 ? undefined : err.details
  });
};
