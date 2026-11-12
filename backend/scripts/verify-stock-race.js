// One-off live verification (no test framework in this repo). 12 concurrent
// real-time sales of qty 1 against stock 5 must yield exactly 5 successes,
// 7 INSUFFICIENT_STOCK rejections and a final stock of 0 (never negative).
require('dotenv').config();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('Refusing to run: DATABASE_URL is not a local database (this script creates and deletes test rows).');
  process.exit(2);
}
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/generateTokens');
const BASE = process.env.VERIFY_BASE || 'http://localhost:5055/api/v1';
const MARK = 'verify-stock-race';
const call = async (token, method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
(async () => {
  const owner = await prisma.user.create({ data: { name: MARK, email: `${MARK}-${Date.now()}@example.com`, password: 'x', role: 'USER' } });
  const shop = await prisma.shop.create({ data: { name: MARK, ownerId: owner.id } });
  await prisma.shopMember.create({ data: { shopId: shop.id, userId: owner.id, role: 'OWNER' } });
  const tok = generateAccessToken({ id: owner.id, role: owner.role });
  let r = await call(tok, 'POST', '/products', { name: MARK + '-p', buyPrice: 1000, sellPrice: 1500, shopId: shop.id, stock: 5 });
  const pid = r.json?.data?.product?.id || r.json?.data?.id;
  if (!pid) { console.log('FAIL could not create product', r.status, JSON.stringify(r.json).slice(0, 200)); process.exit(1); }
  const results = await Promise.all(Array.from({ length: 12 }, () =>
    call(tok, 'POST', '/sales', { product: pid, productName: MARK, quantity: 1, sellPrice: 1500, buyPrice: 1000 })));
  const ok = results.filter((x) => x.status === 201).length;
  const rej = results.filter((x) => x.status === 400).length;
  const p = await prisma.product.findUnique({ where: { id: pid } });
  const sales = await prisma.sale.count({ where: { productId: pid } });
  console.log(`successes=${ok} rejected=${rej} finalStock=${p.stock} salesRows=${sales}`);
  const good = ok === 5 && rej === 7 && p.stock === 0 && sales === 5;
  console.log(good ? 'PASS  no oversell under concurrency' : 'FAIL  oversell / inconsistent state');
  await prisma.sale.deleteMany({ where: { productId: pid } }); await prisma.product.delete({ where: { id: pid } });
  await prisma.shopMember.deleteMany({ where: { shopId: shop.id } }); await prisma.shop.delete({ where: { id: shop.id } }); await prisma.user.delete({ where: { id: owner.id } });
  await prisma.$disconnect(); process.exit(good ? 0 : 1);
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
