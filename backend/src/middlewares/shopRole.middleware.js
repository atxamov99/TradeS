const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getUserShopIds } = require('../utils/shopAccess');

const PLATFORM_STAFF = ['ADMIN', 'SUPER_ADMIN'];

/**
 * Business-role gate: the caller must belong to at least one shop (as OWNER or
 * CASHIER) to reach shop write/sell endpoints. Platform staff
 * (ADMIN/SUPER_ADMIN) bypass — they manage the global catalog from the admin
 * panel, not from a shop membership.
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

  const shopIds = await getUserShopIds(req.user.id);
  if (!shopIds.length) {
    throw new ApiError(
      403,
      'You must belong to a shop to perform this action. Create a shop or ask an owner to add you.',
      [],
      '',
      'NO_SHOP_MEMBERSHIP'
    );
  }

  // Memoize so downstream handlers don't re-query the same membership set.
  req.shopIds = shopIds;
  next();
});

module.exports = { requireShopMember };
