// Clamp a client-supplied page size to a safe range. Prevents a caller from
// requesting an unbounded `take` (e.g. limit=1000000) and exhausting the DB/memory
// (DoS). Falls back to `fallback` for missing/invalid values and caps at `max`.
const MAX_LIMIT = 100;

const clampLimit = (limit, fallback = 20, max = MAX_LIMIT) => {
  const n = Number(limit);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
};

module.exports = { clampLimit, MAX_LIMIT };
