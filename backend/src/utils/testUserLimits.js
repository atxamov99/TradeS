const ApiError = require('./ApiError');

// A test account gets 7 days from creation OR a combined 45 product/sale
// creations, whichever comes first — enough to genuinely try the app without
// becoming a permanent free tier. Read access (viewing products/sales/dashboard)
// is never blocked by this — only new writes are.
const TEST_USER_TTL_DAYS = 7;
const TEST_USER_ACTION_CAP = 45;

const testUserExpiresAt = (fromDate) => {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + TEST_USER_TTL_DAYS);
  return d;
};

// Throws ApiError(403, ..., 'TEST_USER_EXPIRED') if a test user has hit their
// time or action limit. No-op for non-test users. Call before creating a
// product or sale; increment testActionCount afterward on success.
const assertTestUserWithinLimits = (user) => {
  if (!user || !user.isTestUser) return;
  const expired = user.testExpiresAt && new Date(user.testExpiresAt) < new Date();
  const capped = user.testActionCount >= TEST_USER_ACTION_CAP;
  if (expired || capped) {
    throw new ApiError(403, 'Test account limit reached', [], '', 'TEST_USER_EXPIRED');
  }
};

module.exports = { TEST_USER_TTL_DAYS, TEST_USER_ACTION_CAP, testUserExpiresAt, assertTestUserWithinLimits };
