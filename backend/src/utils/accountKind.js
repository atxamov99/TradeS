// What an account IS, derived from its platform role and its shop memberships (the same rule the apps use):
//   ADMIN    - platform administrator
//   DIRECTOR - OWNER of a business shop
//   USER     - works for themselves (owner of a personal shop, or no shop yet)
//   CASHIER  - only a CASHIER member of somebody else's shop
const deriveKind = (user, memberships) => {
  if (user.role === 'ADMIN') return 'ADMIN';
  const m = memberships || [];
  if (m.some((x) => x.role === 'OWNER' && x.shop && x.shop.isBusiness)) return 'DIRECTOR';
  if (m.some((x) => x.role === 'OWNER')) return 'USER';
  if (m.some((x) => x.role === 'CASHIER')) return 'CASHIER';
  return 'USER';
};

// Name of the shop that explains the kind (director's shop / the shop a cashier works in).
const kindShopName = (kind, memberships) => {
  const m = memberships || [];
  if (kind === 'DIRECTOR') return (m.find((x) => x.role === 'OWNER' && x.shop && x.shop.isBusiness) || {}).shop?.name || null;
  if (kind === 'CASHIER') return (m.find((x) => x.role === 'CASHIER') || {}).shop?.name || null;
  return null;
};

module.exports = { deriveKind, kindShopName };
