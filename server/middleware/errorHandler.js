import { logger } from '../utils/logger.js';

export const notFoundHandler = (req, res) => {
  if (req.accepts('html') && !req.path.startsWith('/api/')) {
    return res.sendFile(req.app.locals.indexFile);
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
