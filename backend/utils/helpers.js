function sendResponse(res, statusCode, success, message, data = null) {
  return res.status(statusCode).json({
    success,
    message,
    data
  });
}

function normalizeIsbn(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\s-]/g, '').trim();
}

function isValidIsbn(raw) {
  if (typeof raw !== 'string' || !/^[\d\s-]+$/.test(raw.trim())) {
    return false;
  }
  const digits = normalizeIsbn(raw);
  return digits.length === 10 || digits.length === 13;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  sendResponse,
  normalizeIsbn,
  isValidIsbn,
  escapeRegex
};
