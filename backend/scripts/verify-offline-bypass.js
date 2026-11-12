// One-off live verification (no test framework in this repo): the real-time
// sales endpoint must ignore a client-supplied isFromOffline; offline sync may
// still go negative but must leave a STOCK_NEGATIVE audit entry.
require('dotenv').config();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('Refusing to run: DATABASE_URL is not a local database (this script creates and deletes test rows).');
  process.exit(2);
}
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/generateTokens');
const BASE = process.env.VERIFY_BASE || 'http://localhost:5055/api/v1';
const MARK = 'verify-offline-' + Date.now();
let pass = 0, fail = 0;
const ck = (l, c, x) => { c ? (pass++, console.log('PASS ', l)) : (fail++, console.log('FAIL ', l, x !== undefined ? JSON.stringify(x).slice(0, 220) : '')); };
const call = async (token, method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
(async () => {
  const owner = await prisma.user.create({ data: { name: MARK, email: `${MARK}@example.com`, password: 'x', role: 'USER' } });
  const cashier = await prisma.user.create({ data: { name: MARK + 'c', email: `${MARK}c@example.com`, password: 'x', role: 'USER' } });
  const shop = await prisma.shop.create({ data: { name: MARK, ownerId: owner.id } });
  await prisma.shopMember.createMany({ data: [{ shopId: shop.id, userId: owner.id, role: 'OWNER' }, { shopId: shop.id, userId: cashier.id, role: 'CASHIER' }] });
  const tO = generateAccessToken({ id: owner.id, role: owner.role });
  const tC = generateAccessToken({ id: cashier.id, role: cashier.role });
  try {
    let r = await call(tO, 'POST', '/products', { name: MARK + '-p', buyPrice: 1000, sellPrice: 1500, shopId: shop.id, stock: 1 });
    const pid = r.json?.data?.product?.id || r.json?.data?.id;
    r = await call(tC, 'POST', '/sales', { product: pid, productName: 'p', quantity: 5, sellPrice: 1500, buyPrice: 1000, isFromOffline: true });
    ck('cashier cannot bypass stock check with isFromOffline:true on POST /sales = 400', r.status === 400, r);
    let p = await prisma.product.findUnique({ where: { id: pid } });
    ck('stock untouched after rejected sale (still 1)', p.stock === 1, p.stock);
    r = await call(tC, 'POST', '/sales/bulk-sync', { sales: [{ product: pid, productName: 'p', quantity: 5, sellPrice: 1500, buyPrice: 1000, isFromOffline: true, syncId: MARK + '-s1' }] });
    ck('offline bulk-sync of a sale already made = accepted', r.status === 200 && r.json?.data?.results?.[0]?.status === 'synced', r);
    p = await prisma.product.findUnique({ where: { id: pid } });
    ck('stock went negative (-4) via offline path, by design', p.stock === -4, p.stock);
    await new Promise((res) => setTimeout(res, 400));
    const log = await prisma.auditLog.findFirst({ where: { action: 'STOCK_NEGATIVE', targetId: pid } });
    ck('STOCK_NEGATIVE audit entry written (owner can see it)', !!log && log.metadata?.stockAfter === -4, log);
    r = await call(tO, 'GET', `/shops/${shop.id}/expenses?from=not-a-date`);
    ck("expenses ?from=garbage -> 400 INVALID_DATE (not 500)", r.status === 400 && r.json?.code === 'INVALID_DATE', r);
  } finally {
    await prisma.auditLog.deleteMany({ where: { actorId: { in: [owner.id, cashier.id] } } });
    await prisma.sale.deleteMany({ where: { shopId: shop.id } });
    await prisma.product.deleteMany({ where: { shopId: shop.id } });
    await prisma.shopMember.deleteMany({ where: { shopId: shop.id } });
    await prisma.shop.delete({ where: { id: shop.id } });
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, cashier.id] } } });
    console.log(`${pass} passed, ${fail} failed`);
    await prisma.$disconnect();
    process.exit(fail ? 1 : 0);
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
