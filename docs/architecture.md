# TradeS Architecture

> Rewritten 2026-07-22 to match the code actually running today. The previous
> version of this file described the original pre-build plan (MongoDB +
> Mongoose e-commerce site) — that plan was abandoned early on; this
> document was never updated to follow, which caused real confusion in the
> team (see the "Claude's" Telegram group, 2026-07-22). Ground truth from
> now on = the code in this repo, not this file — if this file and the code
> disagree again in the future, trust the code and fix this file.

## System Overview

Monorepo with three clients sharing a single backend API:

```
TradeS/
├── backend/          Node.js + Express + Prisma + PostgreSQL (Neon)
├── web/               React 18 + Vite + Zustand + Tailwind CSS
├── mobile/            React Native + Expo Router, offline-first (WatermelonDB)
└── docs/              This documentation
```

The product started as a generic e-commerce storefront (hence the Cart/
Wishlist/Order/Review models still present in the schema) and pivoted into
a multi-tenant shop/POS sales tracker (Shop/ShopMember, owner vs cashier)
in response to a real owner request (2026-07-18, see `CLAUDE.md`). The
storefront code was **not deleted** — it's dormant, not the default path —
because ripping it out was judged riskier than leaving it.

---

## Backend Architecture (Layered)

```
backend/src/
├── config/
│   └── db.js                Prisma client instantiation
├── prisma/schema.prisma      Single source of truth for all models
├── services/                Pure business logic (no HTTP concerns)
│   ├── auth.service.js, user.service.js, product.service.js
│   ├── sale.service.js, sync.service.js, audit.service.js
│   ├── cart.service.js, wishlist.service.js, order.service.js, admin.service.js
├── controllers/              HTTP layer — delegates to services
├── routes/
│   └── index.js               Central route aggregator
├── middlewares/
│   ├── auth.middleware.js      JWT access-token verification
│   ├── rbac.middleware.js      Platform-level RBAC (USER/ADMIN/SUPER_ADMIN)
│   ├── shopRole.middleware.js  requireShopMember — shop-level gate (new, PR #19)
│   ├── error.middleware.js     Centralized error handler
│   ├── validate.middleware.js  Joi schema validation
│   └── rateLimiter.middleware.js
├── validators/                Joi schemas
└── utils/
    ├── shopAccess.js           scopeToOwnerOrShop / scopeSalesForViewer / assertShopOwner
    ├── ApiError.js, ApiResponse.js, asyncHandler.js, generateTokens.js, logger.js (winston)
```

### Request Lifecycle
```
Request → CORS → Helmet → Rate Limit (apiLimiter)
       → JSON/urlencoded body parser (50kb limit) → Cookie Parser → morgan (dev only)
       → Route → Auth Middleware → RBAC / requireShopMember → Validation
       → Controller → Service → Prisma → PostgreSQL
       ← Response ← ApiResponse ← Controller
       ← Error Middleware (on failure)
```
(There is no Mongo-sanitize step — Prisma parameterizes queries itself, so
that specific NoSQL-injection concern from the old plan doesn't apply.)

---

## Database Schema (Prisma / PostgreSQL, key models)

```
User
 ├── id, name, email (unique), password (bcryptjs hash)
 ├── role: USER | ADMIN | SUPER_ADMIN            (platform-level role)
 └── addresses[] (Address), shops owned (Shop), shop memberships (ShopMember)

Shop
 ├── id, name, ownerId → User
 └── members[] (ShopMember), products[], sales[], expenses[]

ShopMember
 ├── shopId → Shop, userId → User
 └── role: OWNER | CASHIER                        (shop-level role, orthogonal to User.role)

Product
 ├── id, name, slug (unique), barcode (String?, indexed, NOT unique)
 ├── buyPrice, sellPrice, price, discount, finalPrice, unit, stock
 ├── ownerId → User, shopId → Shop (both optional — legacy/global products have neither)
 └── images[], reviews[], cartItems[], wishlists[] (dormant e-commerce relations)

Sale
 ├── id, userId → User, cashierId → User, shopId → Shop, productId → Product (optional)
 ├── quantity, unit, sellPrice, buyPrice, totalRevenue, totalCost, profit
 ├── syncId (unique, offline-sync idempotency key), isFromOffline
 └── createdAt

Expense
 ├── id, shopId → Shop, amount, category, note, createdById → User
 └── ⚠️ Schema-only: no route/controller/service anywhere reads or writes this model yet.
     The owner's "track shop income vs expense" request is not built on the backend
     despite this table existing (it was scaffolded alongside Shop/ShopMember on 2026-07-18
     and never wired up). README.md correctly lists this as an unbuilt "Phase 4 (V2)" item.

AuditLog
 ├── id, action, category, actor/actorId, target/targetId, metadata (Json), createdAt
 └── ⚠️ Wired up for exactly one thing: LOGIN_FAILED events (auth.service.js). Product
     create/update/restock/delete and sale creation do NOT write here — there is
     currently no record of who restocked a product or when, beyond the row's own
     `updatedAt`. `GET /audit-logs` (ADMIN/SUPER_ADMIN only) reads whatever exists.

InventoryBatch
 └── Exists in schema, but nothing in backend/src references it — unused, like Expense.

Cart / CartItem / Wishlist / Order / OrderItem / Review
 └── Dormant leftovers from the original e-commerce concept. Not deleted (too risky
     to rip out with the pivot mid-flight), but not the product's current focus.
```

---

## Barcode — current state (schema exists, backend lookup does not)

- `Product.barcode` is a real, indexed column, but **no backend endpoint looks a
  product up by barcode** — `createSale`/`updateProduct`/etc. only accept it as a
  passthrough field. There is no `getProductByBarcode` function anywhere.
- On mobile, `BarcodeScanner.tsx` is wired into two *separate, non-integrated* flows:
  - `sales/add.tsx` (POS): scan → match against the locally-synced product cache
    (`p.barcode === code || p.name === code`) → if found, sell it. If not found, the
    scanned code is just dropped into the name-search box — a dead end, not a
    "create this product" prompt.
  - `products/add.tsx` (new product): scan → blindly fills the barcode text field,
    with no duplicate-barcode check.
  - There is **no barcode-driven restock flow** — the product edit/restock screen
    (`products/[id].tsx`) has a plain text field for barcode, no scanner.
- None of this touches the backend's `Shop`/`ShopMember` model — it's entirely
  local-device lookup against the mobile app's own synced cache.

## Restock (stock-in) — current state

- Backend `restockProduct(id, userId, quantity)` (`product.service.js`) takes a
  product **id** (not barcode) and a quantity, and does `stock: { increment: qty }`
  — i.e. it correctly *adds* to existing stock rather than overwriting it. Only the
  shop's `OWNER` may call it (`CASHIER` gets 403); platform `ADMIN`/`SUPER_ADMIN`
  bypass. No audit trail is recorded (see `AuditLog` note above) and no
  `InventoryBatch` row is created despite that model existing.
- Mobile has **no dedicated restock screen**. The only way to change an existing
  product's stock in the app is `products/[id].tsx`'s edit form, which treats
  `stock` as a flat value to **overwrite**, not increment — inconsistent with the
  backend's own `increment` semantics, and with no quantity-received/date/supplier
  capture.

## Owner/cashier role — two unrelated systems, easy to conflate

1. **Backend `ShopMember.role` (OWNER/CASHIER)** — real, enforced server-side (see
   RBAC matrix below). This is what PR #19 built and what's under review.
2. **Mobile `roleStore` (admin/cashier, PIN-gated)** — a completely separate,
   local-device-only concept with **no data link to the backend's Shop/ShopMember
   system whatsoever** (confirmed: zero references to `ShopMember`/`OWNER`/`CASHIER`/
   `shopId` anywhere in `mobile/`). As of 2026-07-22 this local system is also
   **not actually reachable**: nothing in the app ever calls `setRole("cashier")`
   (only `setRole("admin"))` is called, from the PIN-verify screen), so there is no
   in-app path into cashier/locked mode today, and nothing calls `setPIN(...)`
   either, so `verifyPIN`'s hardcoded `"0000"` fallback is the only PIN that works.
   The separate `Employee` model (named staff + individual PINs) is CRUD-only and
   inert — its `pin` field is never read or compared anywhere. `mobile/info/
   done.md`'s 2026-05-03 claim that this flow was fully built no longer matches
   the code (or never did) — treat that changelog entry as stale.

## Known CRITICAL bug (2026-07-22, confirmed independently by code review, not just Abdulaziz's audit)

Stock gets decremented **twice** for one mobile-recorded sale, mechanically:
1. `syncEngine.ts`'s `runSync()` always calls `syncProducts()` before `syncSales()`.
   `syncProducts()` pushes the product's local `stockQty` — which the sale screen
   already decremented optimistically on-device — to the backend as an **absolute
   overwrite** (`stock.js:108-137` treats the incoming value as the new total, not a delta).
2. `syncSales()` then sends the sale itself; the backend's `createSale` independently
   does `stock: { decrement: qty } }` in the same transaction that creates the `Sale` row.
3. The double-reduced number then round-trips back down to every other device via
   `pullProductCatalog()`, and does so *before* the sync-in-progress guard (`isSynced`)
   would otherwise protect it, because that flag flips true right after step 1.
4. Separately: `sale.service.js` hardcodes `isFromOffline: true` for every
   mobile-synced sale unconditionally, so the oversell guard is *always* skipped for
   mobile-originated sales regardless of whether the device was actually offline.

Fix is out of scope for this doc — flagged here so it's not lost; matches item (1)
in Abdulaziz's 2026-07-22 bug audit.

---

## Frontend Architecture (Web)

```
web/src/
├── api/              axios.js (token inject + 401 auto-refresh interceptor),
│                      auth/products/cart/orders/wishlist/admin modules
├── store/ (zustand)   authStore, cartStore, themeStore — persisted
├── components/        ui/, layout/, common/ (ProtectedRoute)
└── pages/              Home, Products, Cart, Checkout, Login/Register, Profile,
                        Wishlist, admin/* (separate platform-admin panel, unrelated
                        to the Shop OWNER/CASHIER concept below)
```

Auth flow (unchanged from the original plan, still accurate): login stores
access+refresh tokens in localStorage + Zustand; axios interceptor injects the
bearer token and silently calls `/auth/refresh-token` on 401, retrying once;
if refresh fails, state clears and the user is redirected to `/login`.

---

## Mobile Architecture

```
mobile/
├── app/ (Expo Router)
│   ├── (auth)/   login, register, verify, verify-email, forgot-password, pin
│   └── (app)/    dashboard, products, sales, customers, suppliers, reports,
│                 settings — offline-first via WatermelonDB (SQLite)
├── services/syncEngine.ts   push sales / pull catalog, see the CRITICAL bug above
├── store/roleStore.ts        local admin/cashier PIN gate — see note above
└── db/                       WatermelonDB schema + models
```

---

## Security Measures (backend)

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS (production, via Render) |
| Headers | Helmet.js |
| CORS | Whitelist-only origins |
| Rate Limiting | `apiLimiter` (express-rate-limit) |
| Input | Joi validation on mutating routes |
| Passwords | bcryptjs |
| Tokens | JWT access + rotating refresh |
| Platform RBAC | `rbac.middleware.js` — USER / ADMIN / SUPER_ADMIN |
| Shop RBAC | `shopRole.middleware.js` (`requireShopMember`) + `assertProductWriteAccess` — see matrix below |

## RBAC — two separate matrices

**Platform-level** (`User.role`):

| Resource | USER | ADMIN | SUPER_ADMIN |
|----------|------|-------|-------------|
| Browse products, cart/wishlist, place orders | ✓ | ✓ | ✓ |
| Manage any product/order (bypass shop scoping) | ✗ | ✓ | ✓ |
| View audit logs | ✗ | ✓ | ✓ |
| Delete users | ✗ | ✗ | ✓ |

> **⚠️ Pending decision (2026-07-22, owner Yahyo, updated same day, not yet
> implemented):** collapse `ADMIN`/`SUPER_ADMIN` into a single `ADMIN` **role**,
> AND — clarified later the same day — there is to be exactly **one admin account**
> in the whole system, period. No inviting/promoting/appointing additional admins,
> ever. This is decided, not open for debate, but not yet built.
>
> Concrete effect once implemented: `POST /admin/register-admin`,
> `POST /admin/register-super-admin`, and `admin.service.js`'s "grant ADMIN/elevated
> role to another user" function all become dead code to remove — the system should
> not be able to create or designate a new admin at all. This also makes the earlier
> "any ADMIN could act on any other ADMIN account" risk moot, since there is no
> second admin account to act on.
> Schema change (`enum Role`) is non-additive — needs a real migration plan. Open
> question, not yet checked: if more than one `ADMIN`/`SUPER_ADMIN` row currently
> exists in prod, those need to be reconciled down to the one intended account as
> part of this work, not silently left as dormant elevated accounts.

**Shop-level** (`ShopMember.role`, applies within a shop a user belongs to):

| Action | OWNER | CASHIER |
|--------|-------|---------|
| Create/update/restock/delete shop products | ✓ | ✗ (403) |
| Record a sale | ✓ | ✓ |
| View own sales | ✓ | ✓ |
| View whole shop's sales/reports | ✓ | ✗ (own only) |

Product **reads** (`getProducts`/`getProductById`/`getProductBySlug`) default to the
pre-Shop **global catalog** behavior for everyone — mobile's `pullProductCatalog`
depends on this default; pass `?scope=shop` to opt into the shop-scoped POS view.
