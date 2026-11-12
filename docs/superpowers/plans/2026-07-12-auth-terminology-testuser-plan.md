# Auth localization, Qop→Мешок cleanup, Dropdown rollout, Test User system — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the localization gaps left in the current branch (backend messages hardcoded in Uzbek instead of using the existing error-code i18n pattern), migrate the last native `<select>` to the custom `Dropdown`, and add a brand-new Test User system (time+usage-capped trial accounts) end to end (schema, backend enforcement, cleanup, and a UI entry point on both web and mobile).

**Architecture:** Follow the codebase's existing conventions exactly — typed `ApiError(status, msg, [], '', CODE)` + frontend `ERROR_CODE_KEYS` maps (already used for `ACCOUNT_EXISTS`/`ACCOUNT_NOT_FOUND`/`WRONG_PASSWORD`) for every new backend error; the existing `isBlocked`-style lazy check (no cron/queue lib exists in this repo) for Test User expiry; the existing custom `Dropdown` component for the last native select. No new dependencies.

**Tech Stack:** Node/Express/Prisma (PostgreSQL) backend; React+Vite+Tailwind+Zustand+react-i18next web; React Native+Expo+react-i18next mobile.

**No test framework exists in any of the three packages** (no jest/vitest configured — confirmed via `package.json` scripts). Steps that would normally be "write failing test → implement → run test" are instead "implement → verify manually" with an exact manual step (curl command or UI click sequence) and expected result. This is a deliberate, called-out gap, not an oversight — introducing a test framework is out of scope for this plan.

---

## Task 1: Backend — code-mapped error for bag-weight validation

**Files:**
- Modify: `backend/src/services/product.service.js:71-73` and `:106-108`

- [ ] **Step 1: Replace the hardcoded Uzbek message with a coded error, in both places**

At line 71-73 (inside `createProduct`):
```js
  if (rest.unit === 'box' && !(Number(rest.bagWeightKg) > 0)) {
    throw new ApiError(400, 'Bag weight (kg) is required', [], '', 'BAG_WEIGHT_REQUIRED');
  }
```

At line 106-108 (inside `updateProduct`):
```js
  if (effectiveUnit === 'box' && !(Number(effectiveBagWeight) > 0)) {
    throw new ApiError(400, 'Bag weight (kg) is required', [], '', 'BAG_WEIGHT_REQUIRED');
  }
```

- [ ] **Step 2: Manual verification**

Run: `cd backend && npm run dev`, then:
```bash
curl -X POST http://localhost:5000/api/v1/products -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"unit\":\"box\",\"price\":1000,\"sellPrice\":1000}"
```
Expected: HTTP 400, JSON body contains `"code":"BAG_WEIGHT_REQUIRED"`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/product.service.js
git commit -m "fix(backend): code-map bag weight validation error instead of hardcoding Uzbek text"
```

---

## Task 2: Backend — code-mapped error for blocked accounts

**Files:**
- Modify: `backend/src/services/auth.service.js:102-105`
- Modify: `backend/src/middlewares/auth.middleware.js:40-42`

- [ ] **Step 1: Add the code in `auth.service.js` login (blocked-at-login case)**

Replace:
```js
  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked');
  }
```
with:
```js
  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked', [], '', 'ACCOUNT_BLOCKED');
  }
```

- [ ] **Step 2: Add the code in `auth.middleware.js` protect (blocked-mid-session case)**

Replace:
```js
  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Contact support.');
  }
```
with:
```js
  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Contact support.', [], '', 'ACCOUNT_BLOCKED');
  }
```

- [ ] **Step 3: Manual verification**

In `psql`/Prisma Studio, set any test user's `isBlocked` to `true`, then attempt login via `POST /api/v1/auth/login`. Expected: HTTP 403, body `"code":"ACCOUNT_BLOCKED"`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/auth.service.js backend/src/middlewares/auth.middleware.js
git commit -m "fix(backend): code-map blocked-account error for frontend localization"
```

---

## Task 3: Web — wire the two new error codes to existing/new translations

**Files:**
- Modify: `web/src/api/axios.js:7-11`
- Modify: `web/src/i18n.js` (3 locations: uz block, ru block, en block — add one new key each, next to the existing `error_account_exists` key)

- [ ] **Step 1: Add `error_account_blocked` to all three language blocks in `web/src/i18n.js`**

Uz block, right after line 116 (`"error_account_exists": "Bunday hisob allaqachon mavjud",`):
```js
            "error_account_blocked": "Hisobingiz bloklangan",
```
Ru block, right after line 268 (`"error_account_exists": "Аккаунт уже существует",`):
```js
            "error_account_blocked": "Аккаунт заблокирован",
```
En block, right after line 420 (`"error_account_exists": "Account already exists",`):
```js
            "error_account_blocked": "Account is blocked",
```

- [ ] **Step 2: Extend `ERROR_CODE_KEYS` in `web/src/api/axios.js`**

Replace:
```js
const ERROR_CODE_KEYS = {
  ACCOUNT_NOT_FOUND: 'error_account_not_found',
  WRONG_PASSWORD: 'error_wrong_password',
  ACCOUNT_EXISTS: 'error_account_exists',
};
```
with:
```js
const ERROR_CODE_KEYS = {
  ACCOUNT_NOT_FOUND: 'error_account_not_found',
  WRONG_PASSWORD: 'error_wrong_password',
  ACCOUNT_EXISTS: 'error_account_exists',
  ACCOUNT_BLOCKED: 'error_account_blocked',
  BAG_WEIGHT_REQUIRED: 'bag_weight_required',
};
```

- [ ] **Step 3: Manual verification**

Run `cd web && npm run dev`, switch UI language to Russian, trigger a blocked-account login and a bag-weight-missing product save (via the UI). Expected: toast shows "Аккаунт заблокирован" / "Выберите вес мешка" respectively, not the raw backend English/Uzbek text.

- [ ] **Step 4: Commit**

```bash
git add web/src/api/axios.js web/src/i18n.js
git commit -m "feat(web): localize blocked-account and bag-weight-required errors"
```

---

## Task 4: Mobile — wire the two new error codes to existing/new translations

**Files:**
- Modify: `mobile/src/utils/apiError.js`
- Modify: `mobile/src/i18n/locales/ru.json:30`, `mobile/src/i18n/locales/uz.json:30`, `mobile/src/i18n/locales/en.json:30` (add one key each, next to `accountExists`)

- [ ] **Step 1: Add `accountBlocked` to all three locale files, right after the `accountExists` line**

`ru.json` line 30 area:
```json
    "accountExists": "Аккаунт уже существует",
    "accountBlocked": "Аккаунт заблокирован",
```
`uz.json` line 30 area:
```json
    "accountExists": "Bunday hisob allaqachon mavjud",
    "accountBlocked": "Hisobingiz bloklangan",
```
`en.json` line 30 area:
```json
    "accountExists": "Account already exists",
    "accountBlocked": "Account is blocked",
```
(Remember to add a trailing comma to the now-not-last preceding line in each file.)

- [ ] **Step 2: Extend `ERROR_CODE_KEYS` in `mobile/src/utils/apiError.js`**

Replace:
```js
const ERROR_CODE_KEYS = {
  ACCOUNT_NOT_FOUND: 'auth.accountNotFound',
  WRONG_PASSWORD: 'auth.wrongPassword',
  ACCOUNT_EXISTS: 'auth.accountExists',
};
```
with:
```js
const ERROR_CODE_KEYS = {
  ACCOUNT_NOT_FOUND: 'auth.accountNotFound',
  WRONG_PASSWORD: 'auth.wrongPassword',
  ACCOUNT_EXISTS: 'auth.accountExists',
  ACCOUNT_BLOCKED: 'auth.accountBlocked',
  BAG_WEIGHT_REQUIRED: 'bagWeightRequired',
};
```

- [ ] **Step 3: Manual verification**

Run `cd mobile && npx expo start`, set device language to Russian, trigger a blocked-account login. Expected: `Alert.alert` shows "Аккаунт заблокирован".

- [ ] **Step 4: Commit**

```bash
git add mobile/src/utils/apiError.js mobile/src/i18n/locales/ru.json mobile/src/i18n/locales/uz.json mobile/src/i18n/locales/en.json
git commit -m "feat(mobile): localize blocked-account and bag-weight-required errors"
```

---

## Task 5: Web — migrate `Sales.jsx` product picker from native `<select>` to `Dropdown`

**Files:**
- Modify: `web/src/pages/Sales.jsx:1-3` (imports), `:111-133` (the select block)

- [ ] **Step 1: Import the existing `Dropdown` component**

Add to the top imports (after line 3):
```js
import Dropdown from '../components/ui/Dropdown';
```

- [ ] **Step 2: Replace the native select block**

Replace lines 111-133:
```jsx
              <div className="relative">
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setQuantity('1');
                    setBagCount('1');
                    setExtraKg('0');
                    setErrors({});
                  }}
                  className={`w-full h-12 rounded-xl border px-4 pr-10 text-base text-[#0F172A] dark:text-slate-100 bg-white dark:bg-[#0F172A] appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${errors.product ? 'border-red-400 bg-red-50 dark:bg-red-500/10' : 'border-[#E2E8F0] dark:border-[#334155]'
                    }`}
                >
                  <option value="">{t('select_product_placeholder')}</option>
                  {inStock.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — {p.stock} {p.unit === 'box' ? 'kg' : t(`unit_${p.unit || 'pcs'}`)} {t('remains')}
                      {p.unit === 'box' && p.bagWeightKg ? ` (${p.bagWeightKg}kg/${t('unit_box')})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-slate-400 pointer-events-none" />
              </div>
```
with:
```jsx
              <Dropdown
                value={productId}
                onChange={(val) => {
                  setProductId(val);
                  setQuantity('1');
                  setBagCount('1');
                  setExtraKg('0');
                  setErrors({});
                }}
                placeholder={t('select_product_placeholder')}
                searchPlaceholder={t('search')}
                error={errors.product}
                options={inStock.map((p) => ({
                  value: p._id,
                  label: `${p.name} — ${p.stock} ${p.unit === 'box' ? 'kg' : t(`unit_${p.unit || 'pcs'}`)} ${t('remains')}${p.unit === 'box' && p.bagWeightKg ? ` (${p.bagWeightKg}kg/${t('unit_box')})` : ''}`,
                }))}
              />
```
Note: `Dropdown` already renders its own error message (`{error && <p ...>{error}</p>}`), so the existing `{errors.product && <p ...>}` block right after (was line 134) becomes redundant — delete it:
```jsx
              {errors.product && <p className="text-red-500 text-sm mt-1">{errors.product}</p>}
```

- [ ] **Step 3: Remove the now-unused `ChevronDown` import if nothing else in the file uses it**

Run: `grep -n "ChevronDown" web/src/pages/Sales.jsx` — if the only remaining reference was the one just deleted, remove `ChevronDown` from the lucide-react import on line 3.

- [ ] **Step 4: Manual verification**

Run `cd web && npm run dev`, open Sales → New Sale, confirm: dropdown opens with animation, typing filters the list (once there are enough products to cross the 6-item search threshold), selecting a product populates the quantity/bag fields exactly as before, dark mode styling matches the rest of the modal.

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/Sales.jsx
git commit -m "refactor(web): replace native select with Dropdown in Sales product picker"
```

---

## Task 6: Prisma schema — Test User fields

**Files:**
- Modify: `backend/prisma/schema.prisma:16-42` (`User` model)

- [ ] **Step 1: Add three fields to the `User` model**

Insert after `lastLogin DateTime?` (line 29):
```prisma
  isTestUser      Boolean        @default(false)
  testExpiresAt   DateTime?
  testActionCount Int            @default(0)
```

- [ ] **Step 2: Push the schema change**

Run: `cd backend && npx prisma db push`
Expected: output ends with "Your database is now in sync with your Prisma schema" and regenerates the client (or run `npx prisma generate` if it doesn't automatically).

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(db): add Test User fields (isTestUser, testExpiresAt, testActionCount)"
```

---

## Task 7: Backend — Test User limits helper

**Files:**
- Create: `backend/src/utils/testUserLimits.js`

- [ ] **Step 1: Write the helper**

```js
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
```

- [ ] **Step 2: Manual verification**

Run: `cd backend && node -e "const m = require('./src/utils/testUserLimits'); console.log(m.testUserExpiresAt(new Date('2026-01-01T00:00:00Z')))"`
Expected: prints a date 7 days after 2026-01-01.

- [ ] **Step 3: Commit**

```bash
git add backend/src/utils/testUserLimits.js
git commit -m "feat(backend): add Test User time/action limit helper"
```

---

## Task 8: Backend — registration endpoint for Test Users

**Files:**
- Modify: `backend/src/services/auth.service.js` (add `registerTestUser`, export it)
- Modify: `backend/src/controllers/auth.controller.js` (add `registerTestUser`, export it)
- Modify: `backend/src/routes/auth.routes.js` (add the public route)

- [ ] **Step 1: Add the service function**

Add to `backend/src/services/auth.service.js`, right after `register` (after line 63), and require the new helper at the top with the other requires (after line 9):
```js
const { testUserExpiresAt } = require('../utils/testUserLimits');
```
This reuses the `issueTokens` helper already defined at the top of the file (lines 19-38) so a test account is logged in immediately, the same way `verifyOtp` logs a new phone signup in immediately:
```js
/**
 * Register a Test User — no email/phone required, auto-expires per
 * testUserLimits. Distinct from the normal register() path so a test account
 * is never created by accident via the regular signup form.
 */
const registerTestUser = async (meta = {}) => {
  const now = new Date();
  const password = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: `Test User ${now.getTime().toString().slice(-6)}`,
      password: hashedPassword,
      isTestUser: true,
      testExpiresAt: testUserExpiresAt(now),
    },
  });

  const { accessToken, refreshToken } = await issueTokens(user, meta);

  const userResponse = { ...user };
  delete userResponse.password;
  return { user: userResponse, accessToken, refreshToken };
};
```

- [ ] **Step 2: Export it**

Change the `module.exports` at the bottom of `auth.service.js`:
```js
module.exports = {
  register, login, refreshTokens, logout, logoutAll, googleAuth,
  requestOtp, verifyOtp, forgotPassword, resetPasswordWithOtp, registerTestUser,
};
```

- [ ] **Step 3: Add the controller**

Add to `backend/src/controllers/auth.controller.js`, after `register` (after line 16), reusing the same cookie-setting shape as `login`:
```js
const registerTestUser = asyncHandler(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'] || '', ip: req.ip };
  const { user, accessToken, refreshToken } = await authService.registerTestUser(meta);

  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(201).json(new ApiResponse(201, { user, accessToken, refreshToken }, 'Test account created'));
});
```

- [ ] **Step 4: Export the controller**

Change `module.exports` at the bottom of `auth.controller.js`:
```js
module.exports = { register, login, refreshToken, logout, logoutAll, getMe, forgotPassword, resetPassword, googleAuth, requestOtp, verifyOtp, registerTestUser };
```

- [ ] **Step 5: Add the public route**

In `backend/src/routes/auth.routes.js`, add after line 15 (`router.post('/register', ...)`):
```js
router.post('/register-test', authLimiter, authController.registerTestUser);
```

- [ ] **Step 6: Manual verification**

```bash
curl -X POST http://localhost:5000/api/v1/auth/register-test
```
Expected: HTTP 201, body contains a `user` with `isTestUser: true` and a `testExpiresAt` ~7 days out, plus `accessToken`/`refreshToken`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/auth.service.js backend/src/controllers/auth.controller.js backend/src/routes/auth.routes.js
git commit -m "feat(backend): add public Test User registration endpoint"
```

---

## Task 9: Backend — enforce limits on product/sale creation

**Files:**
- Modify: `backend/src/services/product.service.js` (top requires + `createProduct`)
- Modify: `backend/src/services/sale.service.js` (top requires + `createSale`)

- [ ] **Step 1: `product.service.js` — check + increment**

Add near the top requires:
```js
const { assertTestUserWithinLimits } = require('../utils/testUserLimits');
```
Modify `createProduct` (the version from Task 1) to check the limit first and increment after success:
```js
const createProduct = async (productData, userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isTestUser: true, testExpiresAt: true, testActionCount: true },
  });
  assertTestUserWithinLimits(user);

  // images is a relation (ProductImage[]) — Prisma needs { create: [...] }, not a raw array
  const { images = [], ...rest } = productData;
  if (rest.unit === 'box' && !(Number(rest.bagWeightKg) > 0)) {
    throw new ApiError(400, 'Bag weight (kg) is required', [], '', 'BAG_WEIGHT_REQUIRED');
  }
  const slug = slugify(rest.name, { lower: true, strict: true }) + '-' + Date.now();
  const finalPrice = rest.price - (rest.price * (rest.discount || 0)) / 100;

  const product = await prisma.product.create({
    data: {
      ...rest,
      slug,
      finalPrice,
      ownerId: userId,
      createdById: userId,
      images: { create: images.map((img) => ({ url: img.url, alt: img.alt || '' })) },
    },
    include: { images: true },
  });

  if (user.isTestUser) {
    await prisma.user.update({ where: { id: userId }, data: { testActionCount: { increment: 1 } } });
  }

  return product;
};
```

- [ ] **Step 2: `sale.service.js` — check + increment inside the existing transaction**

Add near the top requires:
```js
const { assertTestUserWithinLimits } = require('../utils/testUserLimits');
```
Modify `createSale` to check before the transaction and increment inside it:
```js
const createSale = async (userId, saleData) => {
  const { product: productId, productName, quantity, sellPrice, buyPrice, unit, note, syncId, isFromOffline, createdAt } = saleData;

  // Check for duplicate syncId (idempotent offline sync)
  if (syncId) {
    const existing = await prisma.sale.findUnique({ where: { syncId } });
    if (existing) return existing;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isTestUser: true, testExpiresAt: true, testActionCount: true },
  });
  assertTestUserWithinLimits(user);

  const qty = Number(quantity);
  const sp = Number(sellPrice) || 0;
  const bp = Number(buyPrice) || 0;

  if (productId) {
    const owned = await prisma.product.findFirst({
      where: { id: productId, ownerId: userId },
      select: { id: true },
    });
    if (!owned) throw new ApiError(404, `Product ${productId} not found`);
  }

  return await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        userId,
        productId: productId || null,
        productName,
        quantity: qty,
        sellPrice: sp,
        buyPrice: bp,
        totalRevenue: qty * sp,
        totalCost: qty * bp,
        profit: qty * sp - qty * bp,
        unit,
        note,
        syncId,
        isFromOffline: isFromOffline || false,
        createdAt: createdAt ? new Date(createdAt) : undefined,
      },
    });

    if (productId) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: qty } },
      });
    }

    if (user.isTestUser) {
      await tx.user.update({ where: { id: userId }, data: { testActionCount: { increment: 1 } } });
    }

    return sale;
  });
};
```

- [ ] **Step 3: Wire `TEST_USER_EXPIRED` to a translated, actionable message (web + mobile)**

Web `web/src/api/axios.js` `ERROR_CODE_KEYS`, add:
```js
  TEST_USER_EXPIRED: 'error_test_user_expired',
```
Web `web/src/i18n.js`, add one key per language block (next to `error_account_blocked` added in Task 3):
```js
            "error_test_user_expired": "Sinov muddati tugadi. Ro'yxatdan o'ting.",   // uz block
```
```js
            "error_test_user_expired": "Пробный период закончился. Зарегистрируйтесь, чтобы продолжить.",   // ru block
```
```js
            "error_test_user_expired": "Trial period ended. Please register a full account.",   // en block
```
Mobile `mobile/src/utils/apiError.js` `ERROR_CODE_KEYS`, add:
```js
  TEST_USER_EXPIRED: 'auth.testUserExpired',
```
Mobile locale files, add next to `accountBlocked`:
```json
    "testUserExpired": "Пробный период закончился. Зарегистрируйтесь, чтобы продолжить."
```
(ru.json — matching uz/en translations for `uz.json`/`en.json`: `"Sinov muddati tugadi. Ro'yxatdan o'ting."` / `"Trial period ended. Please register a full account."`)

- [ ] **Step 4: Manual verification**

Register a test user (`POST /auth/register-test`), manually set its `testActionCount` to `45` in Prisma Studio, then attempt to create a product as that user. Expected: HTTP 403 with `code: TEST_USER_EXPIRED`; a subsequent `GET /products` as the same user still succeeds (read access unaffected).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/product.service.js backend/src/services/sale.service.js web/src/api/axios.js web/src/i18n.js mobile/src/utils/apiError.js mobile/src/i18n/locales/ru.json mobile/src/i18n/locales/uz.json mobile/src/i18n/locales/en.json
git commit -m "feat: enforce Test User time/action limits on product and sale creation"
```

---

## Task 10: Backend — cleanup sweep for expired Test User data

**Files:**
- Modify: `backend/src/server.js`

- [ ] **Step 1: Add the sweep function and schedule it**

Add near the top requires (after line 19, `const prisma = require('./config/prisma');`):
```js
const { TEST_USER_TTL_DAYS } = require('./utils/testUserLimits');
```
Add before `const startServer = async () => {` (before line 96):
```js
// Test User accounts are hard-deleted a grace period after they expire (not
// immediately at expiry) so an expiring user isn't surprised by data loss the
// instant their trial ends. No queue/cron lib exists in this repo — a simple
// interval on the persistent process matches the existing telegram-polling
// pattern below, and is skipped entirely in the Vercel serverless path.
const TEST_USER_CLEANUP_GRACE_DAYS = 7;
const TEST_USER_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

const cleanupExpiredTestUsers = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TEST_USER_CLEANUP_GRACE_DAYS);
  try {
    const { count } = await prisma.user.deleteMany({
      where: { isTestUser: true, testExpiresAt: { lt: cutoff } },
    });
    if (count > 0) logger.info(`Test User cleanup: removed ${count} expired account(s)`);
  } catch (err) {
    logger.error(`Test User cleanup failed: ${err.message}`);
  }
};
```
Add inside `startServer`, right after the existing `telegramService.startPolling()` block (after line 112, still inside the `if (process.env.NODE_ENV !== 'production')`'s enclosing try block but as its own top-level statement so it runs in every non-Vercel environment including production-on-Render):
```js
    setInterval(cleanupExpiredTestUsers, TEST_USER_CLEANUP_INTERVAL_MS);
    cleanupExpiredTestUsers(); // also run once at boot
```

- [ ] **Step 2: Manual verification**

Create a test user, manually set its `testExpiresAt` in Prisma Studio to 8 days in the past, restart the backend (`npm run dev`), check logs for `Test User cleanup: removed 1 expired account(s)` within a few seconds of boot, confirm the row is gone via Prisma Studio.

- [ ] **Step 3: Commit**

```bash
git add backend/src/server.js
git commit -m "feat(backend): periodic cleanup sweep for expired Test User accounts"
```

---

## Task 11: Web — admin "Test" badge + Test User trial-CTA registration entry point

**Files:**
- Modify: `web/src/pages/admin/AdminUsers.jsx` (badge)
- Modify: `web/src/api/auth.api.js` (new API call)
- Modify: `web/src/store/authStore.js` (new store action)
- Modify: `web/src/pages/Login.jsx` (new CTA button)
- Modify: `web/src/i18n.js` (2 new keys × 3 languages)

- [ ] **Step 1: Admin badge**

In `AdminUsers.jsx`, modify the Role `<td>` (lines 87-89) to add an inline Test badge next to it:
```jsx
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge color={roleColors[u.role] || 'gray'}>{u.role}</Badge>
                        {u.isTestUser && <Badge color="yellow">Test</Badge>}
                      </div>
                    </td>
```

- [ ] **Step 2: API call**

Add to `web/src/api/auth.api.js`, after `register`:
```js
export const registerTestUser = () => api.post('/auth/register-test');
```

- [ ] **Step 3: Store action**

Add to `web/src/store/authStore.js`, after the `register` action:
```js
      registerTestUser: async () => {
        set({ isLoading: true });
        try {
          const res = await authApi.registerTestUser();
          const { user } = res.data.data;
          set({ user, isLoading: false });
          return user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
```

- [ ] **Step 4: i18n keys**

Add to `web/src/i18n.js`, one per language block, next to `"no_account"`:
```js
            "try_demo_cta": "Sinov rejimida ko'rish",       // uz
```
```js
            "try_demo_cta": "Попробовать демо-режим",       // ru
```
```js
            "try_demo_cta": "Try demo mode",                 // en
```

- [ ] **Step 5: Login.jsx CTA**

In `web/src/pages/Login.jsx`, add a handler near `handleSubmit` (after line 98):
```jsx
  const registerTestUser = useAuthStore((s) => s.registerTestUser);

  const handleTryDemo = async () => {
    try {
      await registerTestUser();
      navigate('/dashboard', { replace: true });
    } catch (_) {}
  };
```
(`useAuthStore` is already imported at the top of the file — add `registerTestUser` alongside the existing `login`/`isLoading` selector calls at lines 72-73.)

Add the button in the JSX, right after the closing `</form>` (after line 212), before the "no account" block:
```jsx
          <button
            type="button"
            onClick={handleTryDemo}
            className="w-full h-11 mt-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            {t('try_demo_cta')}
          </button>
```

- [ ] **Step 6: Manual verification**

Run `cd web && npm run dev`, click "Попробовать демо-режим" on the login page. Expected: redirected straight to `/dashboard` with a `Test User NNNNNN` account, no form filled in. Then open `/admin/users` as an admin and confirm the yellow "Test" badge shows next to that account's role badge.

- [ ] **Step 7: Commit**

```bash
git add web/src/pages/admin/AdminUsers.jsx web/src/api/auth.api.js web/src/store/authStore.js web/src/pages/Login.jsx web/src/i18n.js
git commit -m "feat(web): Test User entry point on login + admin visibility badge"
```

---

## Task 12: Mobile — Test User trial-CTA entry point

**Files:**
- Modify: `mobile/src/screens/LoginScreen.js`
- Modify: `mobile/src/i18n/locales/ru.json`, `uz.json`, `en.json` (1 new key each)

- [ ] **Step 1: i18n key**

Add next to `"demoMode"` in each locale file (that key is currently unused dead text from an earlier concept — leave it as-is, add a new one for this feature so intent stays unambiguous):
```json
    "tryTestAccount": "Попробовать демо-режим",
```
(`ru.json`; matching translations `"Sinov rejimida ko'rish"` for `uz.json`, `"Try demo mode"` for `en.json`.)

- [ ] **Step 2: Add the handler + button in `LoginScreen.js`**

Add after `handleLogin` (after line 66):
```js
  const [demoLoading, setDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const response = await apiClient.post('/auth/register-test');
      const { user, accessToken, refreshToken } = response.data.data;
      await setToken(accessToken, refreshToken);
      await setUser(user);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      Alert.alert(t('common.error'), resolveErrorMessage(error, t));
    } finally {
      setDemoLoading(false);
    }
  };
```
Add the button in the JSX right after the "signUp" `<Button>` (after line 138, still inside `<Card>`):
```jsx
          <Button
            title={t('auth.tryTestAccount')}
            onPress={handleTryDemo}
            loading={demoLoading}
            variant="outline"
            style={{ marginTop: 8, borderStyle: 'dashed', borderColor: colors.border }}
            textStyle={{ color: colors.textMuted }}
          />
```

- [ ] **Step 3: Manual verification**

Run `cd mobile && npx expo start`, tap "Попробовать демо-режим" on the login screen. Expected: navigates straight into `MainTabs` with a `Test User NNNNNN` account, no fields filled in.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/LoginScreen.js mobile/src/i18n/locales/ru.json mobile/src/i18n/locales/uz.json mobile/src/i18n/locales/en.json
git commit -m "feat(mobile): Test User entry point on login screen"
```

---

## Task 13: Full manual QA pass (produces the bug list)

**Files:** none (verification only — fixes for anything found get their own follow-up commits, not folded into this task)

- [ ] **Step 1: Auth flows**
Test, on both web and mobile, in Russian locale: register with an already-used phone → expect "Аккаунт уже существует"; login with a non-existent phone → "Аккаунт не найден"; login with wrong password → "Неверный пароль"; login to a blocked account → "Аккаунт заблокирован" (Task 2/3/4 result).

- [ ] **Step 2: Weight/Мешок flows**
Create a product with unit=Мешок (box) and no weight selected → expect the now-localized "Выберите вес мешка" error (Task 1/3/4 result), not Uzbek text. Confirm all 5 presets (5/10/25/50/100 kg) are selectable on both web Dropdown and mobile chips, and the value round-trips through to Sales.jsx's bag-count/extra-kg calculation correctly.

- [ ] **Step 3: Dropdown**
On Sales.jsx, confirm the new Dropdown search box appears once there are more than 6 products, filters correctly, keyboard Escape and click-outside close it, and dark mode renders correctly.

- [ ] **Step 4: Test User lifecycle**
Register a test user, create products/sales up to the cap (or manually set `testActionCount`/`testExpiresAt` in Prisma Studio to simulate), confirm writes are blocked with the translated "Пробный период закончился..." message while reads keep working, confirm the admin Test badge shows, confirm the account disappears ~7 days past expiry (or simulate via Prisma Studio + a manual `cleanupExpiredTestUsers()` call).

- [ ] **Step 5: Write up findings**
For every bug or rough edge found in Steps 1-4 that isn't already covered by Tasks 1-12, write a short markdown list (file, repro steps, expected vs actual) and share it back rather than silently fixing things inline — some may need a product decision (e.g., wording, limit values) before a fix is written.

---

## Out of scope (explicitly, not silently dropped)
- Introducing a test framework (jest/vitest) for any of the three packages.
- Renaming "Qop" inside the Uzbek locale files themselves (that's correct Uzbek terminology).
- Any new job-queue dependency — the `setInterval` sweep in Task 10 is intentionally minimal and only runs on the persistent (non-Vercel-serverless) deployment path, matching the existing Telegram-polling precedent in the same file.
- A `username`/login-handle field — the schema only has `email`/`phone` as identifiers; both are already duplicate-checked.
