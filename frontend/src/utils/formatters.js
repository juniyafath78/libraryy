export const CATEGORIES = [
  'Fiction',
  'Science',
  'History',
  'Technology',
  'Biography',
  'Other'
];

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

export function getTodayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysFormatted(dateStr, days) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return formatDate(utc);
}

export function isValidIsbnInput(raw) {
  if (!raw || !/^[\d\s-]+$/.test(raw.trim())) return false;
  const digits = raw.replace(/[\s-]/g, '');
  return digits.length === 10 || digits.length === 13;
}
