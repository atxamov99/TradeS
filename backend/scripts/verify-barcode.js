// One-off live verification (no test framework in this repo): barcode lookup,
// restock-by-scan, duplicate guard, tenant isolation and RBAC.
require('dotenv').config();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('Refusing to run: DATABASE_URL is not a local database (this script creates and deletes test rows).');
  process.exit(2);
}
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/generateTokens');
const BASE = process.env.VERIFY_BASE || 'http://localhost:5055/api/v1';
const MARK = 'verify-barcode-' + Date.now();
let pass = 0, fail = 0;
const ck = (l, c, x) => { c ? (pass++, console.log('PASS ', l)) : (fail++, console.log('FAIL ', l, x !== undefined ? JSON.stringify(x).slice(0, 180) : '')); };
const call = async (token, method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const mkUser = (n) => prisma.user.create({ data: { name: MARK + n, email: `${MARK}-${n}@example.com`, password: 'x', role: 'USER' } });
(async () => {
  const [owner, cashier, outsider, owner2] = await Promise.all(['o', 'c', 'x', 'o2'].map(mkUser));
  const shop = await prisma.shop.create({ data: { name: MARK, ownerId: owner.id } });
  const shop2 = await prisma.shop.create({ data: { name: MARK + '2', ownerId: owner2.id } });
  await prisma.shopMember.createMany({ data: [
    { shopId: shop.id, userId: owner.id, role: 'OWNER' }, { shopId: shop.id, userId: cashier.id, role: 'CASHIER' },
    { shopId: shop2.id, userId: owner2.id, role: 'OWNER' } ] });
  const T = (u) => generateAccessToken({ id: u.id, role: u.role });
  const [tO, tC, tX, tO2] = [owner, cashier, outsider, owner2].map(T);
  try {
    let r = await call(tO, 'POST', '/products', { name: MARK + '-a', buyPrice: 1000, sellPrice: 1500, shopId: shop.id, stock: 2, barcode: 'BC-123' });
    ck('owner creates product with barcode = 201', r.status === 201, r);
    const pid = r.json?.data?.product?.id || r.json?.data?.id;
    r = await call(tO, 'POST', '/products', { name: MARK + '-dup', buyPrice: 1, sellPrice: 2, shopId: shop.id, stock: 1, barcode: 'BC-123' });
    ck('duplicate barcode in same shop = 409 BARCODE_EXISTS', r.status === 409 && r.json?.code === 'BARCODE_EXISTS', r);
    r = await call(tO2, 'POST', '/products', { name: MARK + '-b', buyPrice: 1, sellPrice: 2, shopId: shop2.id, stock: 1, barcode: 'BC-123' });
    ck('SAME barcode in a DIFFERENT shop is allowed = 201', r.status === 201, r);
    r = await call(tC, 'GET', '/products/barcode/BC-123');
    ck('cashier scan -> 200 with own shop product', r.status === 200 && r.json?.data?.product?.id === pid, r);
    r = await call(tX, 'GET', '/products/barcode/BC-123');
    ck('user without shop -> 403', r.status === 403, r);
    r = await call(tO2, 'GET', '/products/barcode/BC-123');
    ck('other shop sees ITS OWN product, not mine', r.status === 200 && r.json?.data?.product?.id !== pid, r);
    r = await call(tO, 'GET', '/products/barcode/NOPE-000');
    ck('unknown barcode = 404 BARCODE_NOT_FOUND', r.status === 404 && r.json?.code === 'BARCODE_NOT_FOUND', r);
    r = await call(tC, 'PATCH', '/products/barcode/BC-123/restock', { quantity: 3 });
    ck('cashier restock-by-scan = 403 (OWNER-only)', r.status === 403, r);
    r = await call(tO, 'PATCH', '/products/barcode/BC-123/restock', { quantity: 3 });
    ck('owner restock-by-scan = 200', r.status === 200, r);
    const p = await prisma.product.findUnique({ where: { id: pid } });
    ck('stock incremented 2 -> 5 (added, not overwritten)', p.stock === 5, p.stock);
    r = await call(tO, 'PATCH', '/products/barcode/BC-123/restock', { quantity: 0 });
    ck('restock quantity 0 rejected (4xx)', r.status >= 400 && r.status < 500, r);
    r = await call(tO, 'POST', '/products', { name: MARK + '-c', buyPrice: 1, sellPrice: 2, shopId: shop.id, stock: 1, barcode: 'BC-777' });
    const pid2 = r.json?.data?.product?.id || r.json?.data?.id;
    r = await call(tO, 'PATCH', `/products/${pid2}`, { barcode: 'BC-123' });
    ck('update to an already used barcode = 409', r.status === 409, r);
    r = await call(tO, 'PATCH', `/products/${pid2}`, { barcode: 'BC-888' });
    ck('update to a free barcode = 200', r.status === 200, r);
  } finally {
    await prisma.product.deleteMany({ where: { shopId: { in: [shop.id, shop2.id] } } });
    await prisma.shopMember.deleteMany({ where: { shopId: { in: [shop.id, shop2.id] } } });
    await prisma.shop.deleteMany({ where: { id: { in: [shop.id, shop2.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, cashier.id, outsider.id, owner2.id] } } });
    console.log(`${pass} passed, ${fail} failed`);
    await prisma.$disconnect();
    process.exit(fail ? 1 : 0);
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
