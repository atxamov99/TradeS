# 🛒 TradeS — Shop & POS Management Platform

![TradeS](https://img.shields.io/badge/TradeS-Shop_%26_POS-0B3D2E?style=for-the-badge&logo=shopify&logoColor=white)
![Status](https://img.shields.io/badge/Status-Development-2ECC71?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Gemini_1.5-4285F4?style=for-the-badge)

Offline-first sales, inventory, and shop-management platform for small and medium traders in Uzbekistan. Started as a generic e-commerce storefront, then pivoted into a multi-tenant shop/POS tracker (owner + cashier roles) in response to real owner demand. The storefront code is still in the codebase (dormant, not deleted — see below) but is no longer the product's focus.

> **Ground truth for architecture, DB schema, and known bugs lives in [`docs/architecture.md`](docs/architecture.md).** This README is a summary for newcomers — if the two ever disagree, trust `docs/architecture.md` (and the code itself) over this file.

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Platforms](#2-platforms)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Features — built vs. not yet](#5-features--built-vs-not-yet)
6. [Roles & Permissions](#6-roles--permissions)
7. [Security](#7-security)
8. [Setup & Installation](#8-setup--installation)
9. [Known Backlog / Open Issues](#9-known-backlog--open-issues)
10. [Docs Map](#10-docs-map)

---

## 1. Project Overview

- **Product management** — catalog, stock, buy/sell pricing, discounts, soft-delete (archive)
- **Sales logging** — quick sale entry with automatic profit calculation (sell − buy)
- **Shop multi-tenancy** — an OWNER runs a shop and adds CASHIERs; cashiers record sales, owners see the whole shop
- **Offline-first mobile** — sales keep working with no internet (WatermelonDB), sync automatically once back online
- **AI shop assistant** — Gemini-powered, answers natural-language questions about the requesting user's own products/sales (never another user's data)
- **Auth** — email + password, Google Sign-In, or phone number verified through a linked Telegram bot (no SMS gateway is used)

---

## 2. Platforms

| Platform | Stack | Role |
|----------|-------|------|
| **Backend** | Node.js + Express 4 + Prisma 6 (PostgreSQL / Neon) | Single API shared by all clients |
| **Web** | React 18 + Vite + Zustand + Tailwind CSS | Full management UI |
| **Mobile** | Expo (React Native) + Expo Router + WatermelonDB + NativeWind | Offline-first POS for sellers |
| **Admin panel** | Separate platform-administration surface | Platform-level USER/ADMIN/SUPER_ADMIN management, distinct from shop roles |

---

## 3. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Node.js | — |
| Server | Express 4 | — |
| ORM / DB | Prisma 6 + PostgreSQL (Neon) | Single `schema.prisma` is the source of truth |
| Auth | JWT (access + refresh) + bcryptjs | Plus Google OAuth and Telegram-delivered phone OTP |
| Validation | Joi | On mutating routes |
| Logging | Winston (+ daily rotate) | — |
| Security | Helmet, CORS whitelist, express-rate-limit | See [§7 Security](#7-security) |
| AI | Google Gemini 1.5 Flash | Per-user-scoped shop assistant |
| Email | Resend | Transactional email |
| Web hosting | Vercel | — |
| Backend hosting | Render | Free-tier web service, `render.yaml` blueprint (service name `trades-backend`) |
| Offline (mobile) | WatermelonDB (SQLite) | — |

---

## 4. Architecture

```
TradeS/
├── backend/          Node.js + Express + Prisma + PostgreSQL (Neon)
├── web/               React 18 + Vite + Zustand + Tailwind CSS
├── mobile/            React Native + Expo Router, offline-first (WatermelonDB)
└── docs/              Documentation (architecture.md = ground truth)
```

Request lifecycle, full DB schema (User/Shop/ShopMember/Product/Sale/Expense/AuditLog/…), RBAC matrices, and the dormant e-commerce models (Cart/Wishlist/Order/Review) are all documented in detail in [`docs/architecture.md`](docs/architecture.md) — not duplicated here to avoid the two drifting apart again (this happened once already, see that file's own header note).

---

## 5. Features — built vs. not yet

**Built and working:**
- Product CRUD + soft delete, sales logging with auto profit calc
- Shop / ShopMember (OWNER / CASHIER) roles, enforced server-side
- Offline sale recording + sync on mobile
- Gemini AI shop assistant (own-data-scoped)
- Email+password, Google, and Telegram-OTP auth

**Schema exists, not wired up (0% built despite the table being real):**
- **Expense tracking** — `Expense` model exists, no route/controller/service reads or writes it
- **Barcode-driven lookup/restock** — `Product.barcode` column exists and mobile scans into it, but no backend endpoint looks a product up by barcode, and there is no barcode-driven restock flow
- **Audit trail** — `AuditLog` only records `LOGIN_FAILED` events; product/sale/restock actions write nothing

**Decided, not yet implemented:**
- Collapse platform `ADMIN`/`SUPER_ADMIN` into a single `ADMIN` role, with exactly one admin account allowed system-wide (owner decision, needs a real migration plan — see `docs/architecture.md`)

---

## 6. Roles & Permissions

Two **separate** matrices exist — don't conflate them (see `docs/architecture.md` for the full "two unrelated systems" writeup on mobile's local PIN switch):

**Platform-level** (`User.role`):

| Resource | USER | ADMIN | SUPER_ADMIN |
|----------|:----:|:-----:|:-----------:|
| Browse products, cart/wishlist, place orders | ✅ | ✅ | ✅ |
| Manage any product/order (bypass shop scoping) | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ✅ | ✅ |
| Delete users | ❌ | ❌ | ✅ |

**Shop-level** (`ShopMember.role`, within a shop the user belongs to):

| Action | OWNER | CASHIER |
|--------|:-----:|:-------:|
| Create/update/restock/delete shop products | ✅ | ❌ (403) |
| Record a sale | ✅ | ✅ |
| View own sales | ✅ | ✅ |
| View whole shop's sales/reports | ✅ | ❌ (own only) |

---

## 7. Security

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS in production (Render) |
| Headers | Helmet.js |
| CORS | Whitelist-only origins |
| Rate limiting | `express-rate-limit` (`apiLimiter`) |
| Input validation | Joi schemas on mutating routes |
| Passwords | bcryptjs |
| Tokens | JWT access + rotating refresh |
| Platform RBAC | `rbac.middleware.js` (USER / ADMIN / SUPER_ADMIN) |
| Shop RBAC | `shopRole.middleware.js` (`requireShopMember`) + `assertProductWriteAccess` |

---

## 8. Setup & Installation

### Prerequisites
- Node.js v18+
- A PostgreSQL database (Neon recommended — matches production)
- Google Gemini API key (AI assistant)
- Google OAuth client ID (Google Sign-In)
- A Telegram bot token (phone-OTP delivery)
- Resend API key (transactional email)

### Backend
```bash
cd backend
npm install
npx prisma generate

# .env — see .env.example for the full list; key vars:
# DATABASE_URL=postgresql://...neon.tech/...
# JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
# GEMINI_API_KEY / GOOGLE_CLIENT_ID / TELEGRAM_BOT_TOKEN / RESEND_API_KEY

npm run dev
# Server: http://localhost:5002 (health check: /health)
```

### Web
```bash
cd web
npm install
npm run dev
# App: http://localhost:5173 (Vite default)
```

### Mobile
```bash
cd mobile
npm install
npx expo start
# Scan the QR code with Expo Go
```

---

## 9. Known Backlog / Open Issues

_As of 2026-07-26 — verify against `git log`/the "Claude's" Telegram group before assuming any of this is stale._

- **Multi-device stock-sync race condition (unfixed).** The generic product-sync path writes `stock` as an absolute value (not a delta), guarded only by an `updatedAt` timestamp comparison. Two devices on the same shop (an OWNER and a CASHIER both selling concurrently) can silently overwrite each other's already-applied stock decrements. Recommended fix: move to increment/decrement-based sync. Flagged as backlog, no "start" signal given yet.
- **PR #19 (Shop/ShopMember roles)** — built, reviewed, and working on `yahyo-shop-scope` / `yahyo-shop-role-gate`, but **not yet merged to `main`**.
- **`yakubov` branch (3 critical offline-sync fixes: stock double-decrement, product-create idempotency, logout data loss)** — done and verified, but **not yet merged to `main`**.
- **Mobile's local PIN/cashier switch is effectively non-functional** — nothing in the app ever activates cashier mode, and the hardcoded `"0000"` PIN is the only one that works. It has no data link to the real backend `ShopMember` role system.

---

## 10. Docs Map

See [`docs/index.md`](docs/index.md) for the full documentation index (API reference, deployment guide, admin panel docs, etc.). Start with [`docs/architecture.md`](docs/architecture.md) for anything technical.

---

## License

MIT License — use freely for commercial projects.

---

**TradeS — shop management made simple.**
