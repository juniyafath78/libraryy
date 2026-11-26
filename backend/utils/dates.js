const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function parseDateOnly(value) {
  if (!value || typeof value !== 'string') return null;

  const datePart = value.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  const parsed = new Date(Date.UTC(year, month, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function addDaysUTC(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function getDaysDiff(laterDate, earlierDate) {
  return Math.floor((laterDate.getTime() - earlierDate.getTime()) / MS_PER_DAY);
}

module.exports = {
  MS_PER_DAY,
  getTodayUTC,
  parseDateOnly,
  addDaysUTC,
  getDaysDiff
};
