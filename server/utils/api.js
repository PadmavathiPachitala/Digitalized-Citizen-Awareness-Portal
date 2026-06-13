export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const cleanString = (value, max = 500) => {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
};

export const pickLanguage = (value) => {
  const lang = cleanString(value, 8).toLowerCase();
  return ['en', 'hi', 'te'].includes(lang) ? lang : 'en';
};

export const slugify = (value) =>
  cleanString(value, 180).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const ok = (res, payload) => res.json({ ok: true, ...payload });
