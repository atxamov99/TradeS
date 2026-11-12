const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getUserShopIds, ensurePersonalShop } = require('../utils/shopAccess');

const PLATFORM_STAFF = ['ADMIN'];

/**
 * Business-role gate: the caller must belong to at least one shop (as OWNER or
 * CASHIER) to reach shop write/sell endpoints. Platform staff (ADMIN) bypass —
 * they manage the global catalog from the admin panel, not from a shop
 * membership.
 *
 * This closes the core role hole: `product` and `sales` routes were guarded by
 * `protect` alone, so ANY authenticated USER (a buyer, a random signup) could
 * create catalog products, set prices and record sales exactly like a seller.
 * "Is this a logged-in user" and "is this a seller" are two different
 * questions — this middleware answers the second one, at the door.
 *
 * The finer, per-resource question ("is this user the OWNER of the specific
 * shop this product belongs to") stays in the service layer
 * (`assertProductWriteAccess` / `assertShopOwner`), because the target
 * resource isn't loaded yet at middleware time — a route gate can only make
 * the coarse membership decision.
 */
const requireShopMember = asyncHandler(async (req, res, next) => {
  if (!req.user) throw new ApiError(401, 'Not authenticated');
  if (PLATFORM_STAFF.includes(req.user.role)) return next();

  let shopIds = await getUserShopIds(req.user.id);
  if (!shopIds.length) {
    // A user who works for themselves needs no invitation: give them a personal
    // shop on the spot (they own it). Employees/business tools stay locked until
    // they upgrade it to a business with a confirmation code.
    shopIds = await ensurePersonalShop(req.user.id);
  }

  // Memoize so downstream handlers don't re-query the same membership set.
  req.shopIds = shopIds;
  next();
});

module.exports = { requireShopMember };
