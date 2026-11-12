// One-off live verification script (no test framework in this repo — see
// CLAUDE.md). Exercises the real HTTP server against local dev DB for the
// 4-role model: plain USER (no shop), ShopMember OWNER, ShopMember CASHIER,
// single ADMIN. Cleans up its own fixtures at the end.
require('dotenv').config();
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/generateTokens');

const BASE = 'http://localhost:5000/api/v1';
const MARK = 'tmp-verify-roles-2026-07-26';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${label}`); }
  else { fail++; console.log(`FAIL  ${label}  ${extra ? JSON.stringify(extra) : ''}`); }
}

async function call(token, method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

async function main() {
  const owner = await prisma.user.create({
    data: { name: MARK + '-owner', email: `${MARK}-owner@test.local`, password: 'x', role: 'USER' },
  });
  const cashier = await prisma.user.create({
    data: { name: MARK + '-cashier', email: `${MARK}-cashier@test.local`, password: 'x', role: 'USER' },
  });
  const noShopUser = await prisma.user.create({
    data: { name: MARK + '-noshop', email: `${MARK}-noshop@test.local`, password: 'x', role: 'USER' },
  });

  const shop = await prisma.shop.create({
    data: { name: MARK + '-shop', ownerId: owner.id },
  });
  await prisma.shopMember.create({ data: { shopId: shop.id, userId: owner.id, role: 'OWNER' } });
  await prisma.shopMember.create({ data: { shopId: shop.id, userId: cashier.id, role: 'CASHIER' } });

  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  let createdAdmin = false;
  if (!admin) {
    admin = await prisma.user.create({
      data: { name: MARK + '-admin', email: `${MARK}-admin@test.local`, password: 'x', role: 'ADMIN' },
    });
    createdAdmin = true;
  }

  const tOwner = generateAccessToken({ id: owner.id, role: owner.role });
  const tCashier = generateAccessToken({ id: cashier.id, role: cashier.role });
  const tNoShop = generateAccessToken({ id: noShopUser.id, role: noShopUser.role });
  const tAdmin = generateAccessToken({ id: admin.id, role: 'ADMIN' });

  try {
    // 1. Plain USER with no shop cannot create a product
    let r = await call(tNoShop, 'POST', '/products', { name: MARK + '-p1', buyPrice: 1000, sellPrice: 1500 });
    check('USER no-shop -> create product = 403 NO_SHOP_MEMBERSHIP', r.status === 403 && r.json?.code === 'NO_SHOP_MEMBERSHIP', r);

    // 2. CASHIER is a shop member (passes route gate) but is NOT allowed to create shop products (OWNER-only)
    r = await call(tCashier, 'POST', '/products', { name: MARK + '-p2', buyPrice: 1000, sellPrice: 1500, shopId: shop.id });
    check('CASHIER -> create shop product = 403 (OWNER-only)', r.status === 403, r);

    // 3. OWNER can create a shop product
    r = await call(tOwner, 'POST', '/products', { name: MARK + '-p3', buyPrice: 1000, sellPrice: 1500, shopId: shop.id, stock: 10 });
    check('OWNER -> create shop product = 201', r.status === 201, r);
    const productId = r.json?.data?.product?.id || r.json?.data?.id;
    check('OWNER create product returned an id', !!productId, r);

    // 4. CASHIER CAN record a sale (shop member, sales POST only requires membership)
    r = await call(tCashier, 'POST', '/sales', {
      product: productId, productName: MARK + '-p3', quantity: 1, sellPrice: 1500, buyPrice: 1000,
    });
    check('CASHIER -> record sale = 201', r.status === 201, r);

    // 5. CASHIER cannot restock/update/delete the product (OWNER-only)
    r = await call(tCashier, 'PATCH', `/products/${productId}/restock`, { quantity: 5 });
    check('CASHIER -> restock product = 403 (OWNER-only)', r.status === 403, r);

    // 6. OWNER can restock
    r = await call(tOwner, 'PATCH', `/products/${productId}/restock`, { quantity: 5 });
    check('OWNER -> restock product = 200', r.status === 200, r);

    // 7. Plain USER (no shop) cannot record a sale either
    r = await call(tNoShop, 'POST', '/sales', {
      product: productId, productName: MARK + '-p3', quantity: 1, sellPrice: 1500, buyPrice: 1000,
    });
    check('USER no-shop -> record sale = 403 NO_SHOP_MEMBERSHIP', r.status === 403 && r.json?.code === 'NO_SHOP_MEMBERSHIP', r);

    // 8. ADMIN bypasses the shop-membership gate entirely (platform staff)
    r = await call(tAdmin, 'POST', '/products', { name: MARK + '-p4', buyPrice: 1, sellPrice: 2 });
    check('ADMIN -> create product (no shop) = 201 (platform bypass)', r.status === 201, r);
    const adminProductId = r.json?.data?.product?.id || r.json?.data?.id;

    // 9. ADMIN-only platform route: /admin/stats
    r = await call(tAdmin, 'GET', '/admin/stats');
    check('ADMIN -> GET /admin/stats = 200', r.status === 200, r);

    r = await call(tOwner, 'GET', '/admin/stats');
    check('OWNER (not ADMIN) -> GET /admin/stats = 403', r.status === 403, r);

    r = await call(tCashier, 'GET', '/admin/stats');
    check('CASHIER (not ADMIN) -> GET /admin/stats = 403', r.status === 403, r);

    r = await call(tNoShop, 'GET', '/admin/stats');
    check('plain USER (not ADMIN) -> GET /admin/stats = 403', r.status === 403, r);

    // 10. Also add a second cashier's sale so OWNER-sees-all vs CASHIER-sees-own is a real distinction
    const cashier2 = await prisma.user.create({
      data: { name: MARK + '-cashier2', email: `${MARK}-cashier2@test.local`, password: 'x', role: 'USER' },
    });
    await prisma.shopMember.create({ data: { shopId: shop.id, userId: cashier2.id, role: 'CASHIER' } });
    const tCashier2 = generateAccessToken({ id: cashier2.id, role: cashier2.role });
    await call(tCashier2, 'POST', '/sales', {
      product: productId, productName: MARK + '-p3', quantity: 1, sellPrice: 1500, buyPrice: 1000,
    });

    r = await call(tOwner, 'GET', '/reports/summary');
    const ownerCount = r.json?.data?.allTime?.salesCount;
    r = await call(tCashier, 'GET', '/reports/summary');
    const cashierCount = r.json?.data?.allTime?.salesCount;
    check(
      `OWNER sees whole-shop sales (${ownerCount}) > CASHIER sees only own (${cashierCount})`,
      Number.isFinite(ownerCount) && Number.isFinite(cashierCount) && ownerCount === 2 && cashierCount === 1,
      { ownerCount, cashierCount }
    );

    // 11. No SUPER_ADMIN role value exists in the DB enum at all
    const roleValues = await prisma.$queryRawUnsafe(`
      SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'Role';
    `);
    const labels = roleValues.map((r) => r.enumlabel);
    check('DB enum Role has no SUPER_ADMIN value anymore', !labels.includes('SUPER_ADMIN'), labels);

    console.log(`\n${pass} passed, ${fail} failed`);
  } finally {
    // Cleanup — always, even on failure/exception.
    await prisma.sale.deleteMany({ where: { productName: { contains: MARK } } });
    await prisma.product.deleteMany({ where: { name: { contains: MARK } } });
    await prisma.shopMember.deleteMany({ where: { shopId: shop.id } });
    await prisma.shop.delete({ where: { id: shop.id } });
    await prisma.user.deleteMany({ where: { email: { contains: MARK } } });
    if (createdAdmin) await prisma.user.delete({ where: { id: admin.id } }).catch(() => {});
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(1); });
