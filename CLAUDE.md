# TradeS / Savdo-E — working rules for AI agents

This repo is worked on by multiple humans and multiple AI agents (Claude
instances under different identities, `@NovaMindAgent_bot`) coordinating in
the Telegram group **"Claude's"**. These rules were negotiated live between
the agents and the two owners (Why Stoic, Abdulaziz) on 2026-07-18/19 —
follow them, don't relitigate them from scratch each session.

## Governance (hard rules, not suggestions)

- **No AI agent pushes directly to any branch on `origin`, ever, and no
  AI agent merges a PR.** Do the work on a branch, commit locally, and hand
  it off as a `git format-patch` bundle (or ask a human to pull/push your
  local branch) for a human to push and open the PR. This was deliberately
  agreed as the one thing that stays human-gated even when everything else
  about the workflow is automated — don't propose removing it as a "quality
  of life" improvement without asking the owner first, and expect the
  answer to be no by default.
- Merge into `main` requires a human (Why Stoic or Abdulaziz), after
  staging verification. Self-merge by an agent is not allowed even if CI is
  green and reviews are approved.
- Schema changes: additive only by default (new columns nullable). Any
  `NOT NULL` tightening or destructive migration is a separate, later step
  after a backfill script has run and been verified — never bundle a
  backfill + hard constraint in one migration.
- Cross-shop/cross-user data access is a security question, not a
  convenience question — when adding a new query or endpoint, ask "who
  should NOT see this" before "does this work." `backend/src/utils/
  shopAccess.js` (`scopeToOwnerOrShop`, `scopeSalesForViewer`,
  `assertShopOwner`) is the shared, load-bearing scoping mechanism —
  extend it rather than writing one-off `where` clauses per query.

## Current architecture state (as of 2026-07-19)

- Shop/ShopMember model added: `Shop {ownerId}` / `ShopMember
  {shopId, userId, role: OWNER|CASHIER}`. A user can belong to multiple
  shops. `backend/scripts/backfillShops.js` gives every pre-existing user
  their own shop (idempotent — safe to re-run).
- **Role actually gates access now** (it didn't at first — see below):
  - Sales/reports: OWNER sees the whole shop (all cashiers' sales),
    CASHIER sees only their own (`cashierId = userId`). Legacy
    no-shop-membership accounts keep seeing just their own sales, same as
    pre-Shop behavior.
  - Product writes (`create/update/restock/delete`) inside a shop:
    OWNER-only. A CASHIER can sell but not edit the catalog or set
    prices — this was fixed after a real review catch (see history below),
    don't reintroduce write access for CASHIER without a specific reason.
  - Product reads (`getProducts/getProductById/getProductBySlug`) default
    to the pre-existing **global catalog** behavior (every authenticated
    user sees every product) — mobile sync's `pullProductCatalog`
    (`mobile/services/syncEngine.ts`) depends on exactly this default, do
    not change it. Pass `?scope=shop` to opt into the shop-scoped POS view
    instead of changing the default.
- **Two parallel i18n systems exist on web** (`web/src/i18n.js`, the real
  react-i18next config almost everything uses, and `web/src/i18n/
  index.jsx`, a custom `I18nProvider`/`useI18n` still consumed by ~10
  admin-template pages: admins/audit-logs/content/permissions/profile/
  reports/roles/users). This is real tech debt, not dead code — removing
  the second system means migrating those 10 pages, not deleting a file.
- **Known-dead, needs a human `rm` (AI agents can't delete files/dirs in
  this environment — see below):** `backend/src/middleware/` (empty,
  `.gitkeep` only — real code is in `middlewares/`), and root junk files
  `nul`, `expo`, `savdo-mobile@1.0.0`, folder `«`.
- CI: `.github/workflows/secret-scan.yml` runs `gitleaks/gitleaks-action@v2`
  — that action takes **zero `with:` inputs**, configure it via env vars
  only (`GITHUB_TOKEN`, `GITLEAKS_LICENSE`) or it fails with "Unexpected
  input(s)" regardless of whether a secret was actually found.
  `npm audit` runs per-workspace (backend/web/mobile) as a separate CI
  check. Backend and web are kept at 0 high/critical (non-breaking `npm
  audit fix` only — never `--force` without testing). Mobile has known
  high-severity findings in Expo-related packages that need a breaking
  major-version bump — do not run `npm audit fix --force` there without a
  dedicated, tested follow-up; owners have agreed mobile-audit can be a
  non-required/non-blocking check on unrelated PRs in the meantime.

## Environment quirks worth knowing

- Headless/Telegram-dispatched Claude sessions in this project (see
  `D:\AI\telegram-copilot`) may or may not have `git push` blocked at the
  tool-permission layer depending on which dispatcher config launched
  them — don't assume either way, just try it and read the actual result.
  Never claim a branch is "pushed" or "ready for review" without verifying
  with `git log --oneline origin/<branch>..<branch>` (empty = actually on
  origin).
- `rm`/`rmdir`/`git rm`/`git clean`/`git reset --hard` are hard-blocked in
  at least the `telegram-copilot`-dispatched sessions (`HARD_DISALLOWED_TOOLS`
  in `status_bot/tasks.py`) — deletions need a human with real shell
  access, don't waste time retrying them.
- Local dev DB is `postgresql://...@localhost:5432/savdo_db` — safe to
  write/read/mutate freely for live verification (this is how every
  scoping/RBAC fix in this project has been verified, since there's no
  automated test suite — see below). Always clean up any temp rows you
  create during verification.
- **No test framework exists in this repo** (no jest/mocha/vitest in any
  of backend/web/mobile `package.json`). This is the established
  convention, not an oversight — verification here means live-testing
  against the local dev DB / `npm run build`, not writing a test suite
  as a side effect of an unrelated change.

## History (why some of the above rules exist)

The Shop/ShopMember RBAC went through several real review rounds
(`@YakubovAbdulaziz` reviewing patches from `Claude Yahyo`/`@claude_pilotbot`):
an early patch shipped shop*-scoped* reads/writes that didn't check *role*
within the shop — a CASHIER could see the whole shop's profit and could
edit/delete any product. Both were caught in review, not before shipping.
Lesson generalized above: role-based access needs to be checked
independently of scope (shop membership) — "is this the right shop" and
"is this the right role" are two separate questions, don't conflate them
into one helper call.
