# Auth messages, Qop→Мешок terminology, Dropdown rollout, Test User system — design

## Goal
Close the remaining gaps in a partially-finished branch (already adds coded auth error messages, weight-in-kg presets, and a custom Dropdown component) and add a brand-new Test User system, per the user's Russian requirements doc.

## Current state (verified in codebase, see prior research)
- `auth.service.js` already throws `ApiError(..., code)` for `ACCOUNT_EXISTS` / `ACCOUNT_NOT_FOUND` / `WRONG_PASSWORD`; `mobile/src/utils/apiError.js` and `web/src/api/axios.js` already map these codes to localized RU/UZ/EN strings. This is correct and untouched.
- Two messages are NOT code-mapped and stay hardcoded in Uzbek regardless of UI locale:
  - `product.service.js:71,105` — `"Qop og'irligini (kg) tanlang"` (bag weight required validation).
  - `auth.service.js:104` — `"Your account has been blocked"` (English, no code) for `isBlocked` at login.
- Weight-in-kg presets `[5,10,25,50,100]` already exist and are mandatory (backend + mobile chips + web Dropdown). No further work needed here beyond QA verification.
- `web/src/components/ui/Dropdown.jsx` exists (search, animation, dark mode) and is used in `Products.jsx`. `Sales.jsx:112,124,126` still uses 3 native `<select>` elements for the product picker — not yet migrated.
- No "Test User" concept exists anywhere (no schema field, no logic, no UI). Built from scratch.
- No cron/queue infra exists in the backend. Existing precedent for time-limited/flagged accounts is `User.isBlocked`, enforced lazily in `auth.middleware.js:40` (checked on every authenticated request) — Test User expiry will follow this same lazy-check pattern rather than adding a new job scheduler dependency.
- RBAC precedent: `backend/src/middlewares/rbac.middleware.js` exports `authorize(...roles)`; admin user management lives in `web/src/pages/admin/AdminUsers.jsx` + `admin.service.js`/`admin.controller.js`, with existing block/unblock actions as a UI precedent.
- No test framework (jest/vitest) exists in any of the three packages. Verification will be manual (run app, exercise flows) rather than automated unit tests, called out explicitly rather than silently skipped.

## Changes

### 1. Localization fixes (small)
- `product.service.js`: replace hardcoded Uzbek bag-weight message with `ApiError(400, 'Bag weight (kg) is required', [], '', 'BAG_WEIGHT_REQUIRED')`. Add `BAG_WEIGHT_REQUIRED` to the existing `ERROR_CODE_KEYS` maps in `web/src/api/axios.js` and `mobile/src/utils/apiError.js`, pointing at the existing `bag_weight_required` i18n key (already translated in all 3 locales).
- `auth.service.js:104`: change blocked-account error to carry `code: 'ACCOUNT_BLOCKED'`. Add a new i18n key `error_account_blocked` = "Аккаунт заблокирован" (ru) / matching uz/en, wire into both `ERROR_CODE_KEYS` maps.

### 2. Dropdown rollout — `Sales.jsx`
Replace the 3 native `<select>` elements (product picker at lines 112/124/126) with the existing `web/src/components/ui/Dropdown.jsx`, matching the `{value, label}` options pattern already used in `Products.jsx`. No new component needed.

### 3. Test User system
**Schema** (`schema.prisma`, `User` model): add
- `isTestUser Boolean @default(false)`
- `testExpiresAt DateTime?` — set to `createdAt + 7 days` at creation time.
- `testActionCount Int @default(0)` — incremented on each product-create and each sale-create while `isTestUser` is true.

**Limits** (enforced server-side, not just UI): a test user is blocked from creating further products/sales once EITHER `testExpiresAt` has passed OR `testActionCount >= 45` (15 products + 30 sales combined budget, matching the earlier-agreed policy), whichever comes first. Enforcement point: a small `assertTestUserNotExpired(user)` helper called at the top of `product.service.js` create and `sale.service.js` create (mirrors the existing `isBlocked` check style). On breach, throws `ApiError(403, ..., [], '', 'TEST_USER_EXPIRED')` — frontend shows a localized "your trial has ended, please register a full account" message with a CTA, not a generic error toast.
- Read-only actions (viewing products/sales/dashboard) remain available after expiry so the user isn't locked out mid-session with no explanation — only new writes are blocked.
- Test users cannot be promoted to ADMIN/SUPER_ADMIN and cannot access `/admin/*` routes (already implied by `authorize()` since `role` stays `USER`; explicitly documented here as a non-goal to change).

**Registration entry point**: a new public endpoint `POST /auth/register-test` creates a `USER`-role account with `isTestUser: true`, no email/phone required (auto-generated placeholder name "Test User N" style), immediate login (same token issuance as `register`). This is how "убедиться что тестовые пользователи не выполняют полноценную работу" is satisfied — it's a distinct, clearly-labeled path, not a checkbox on the normal signup form.

**Data lifecycle**: since no cron infra exists, add a lightweight `setInterval` in `server.js` (runs every 6h) that hard-deletes `User` rows where `isTestUser: true AND testExpiresAt < now() - 7 days` (i.e., 7 days past expiry, not at expiry — gives a grace window before data loss), cascading through existing `onDelete: Cascade` relations (Address, Cart, RefreshToken, Wishlist) — Products/Sales created by a test user are also deleted (they're throwaway data, not real inventory).

**Admin visibility**: `AdminUsers.jsx` gets a small "Test" badge next to the role badge (reusing the existing badge pattern) so admins can distinguish test accounts at a glance. No new admin actions required beyond existing block/unblock.

**UI entry point**: `LoginScreen.js`/`Login.jsx` gets a "Попробовать демо" / "Try demo" link/button below the normal login form, calling `register-test` and navigating straight into the app.

## Out of scope
- Any new job-queue/cron dependency (Bull, Agenda) — the `setInterval` sweep is intentionally minimal, matching existing infra.
- Automated test suite setup for the three packages (none exists) — flagged as a gap, not solved here.
- Renaming "Qop" in the Uzbek locale itself — that's the correct Uzbek word for the concept; only the backend hardcoded leak and cross-locale consistency are bugs.
- Any change to the already-working weight-preset UI.

## Testing
- Manual click-through per flow (register/login duplicate+not-found+wrong-password+blocked, product create without bag weight, Sales.jsx dropdown search/select, register-test → create products/sales up to the cap → confirm block → confirm read access still works, admin badge visible) — full pass tracked as its own follow-up QA phase per the user's request, producing a written bug list.
