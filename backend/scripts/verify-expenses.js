// One-off live verification (no test framework in this repo): shop expenses
// (OWNER-only), net profit in the summary, and the inventory audit trail.
require('dotenv').config();
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/generateTokens');
const BASE = process.env.VERIFY_BASE || 'http://localhost:5055/api/v1';
const MARK = 'verify-exp-' + Date.now();
let pass = 0, fail = 0;
const ck = (l, c, x) => { c ? (pass++, console.log('PASS ', l)) : (fail++, console.log('FAIL ', l, x !== undefined ? JSON.stringify(x).slice(0, 200) : '')); };
const call = async (token, method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const mkUser = (n) => prisma.user.create({ data: { name: MARK + n, email: `${MARK}-${n}@example.com`, password: 'x', role: 'USER' } });
(async () => {
  const [owner, cashier, owner2] = await Promise.all(['o', 'c', 'o2'].map(mkUser));
  const shop = await prisma.shop.create({ data: { name: MARK, ownerId: owner.id } });
  const shop2 = await prisma.shop.create({ data: { name: MARK + '2', ownerId: owner2.id } });
  await prisma.shopMember.createMany({ data: [
    { shopId: shop.id, userId: owner.id, role: 'OWNER' }, { shopId: shop.id, userId: cashier.id, role: 'CASHIER' },
    { shopId: shop2.id, userId: owner2.id, role: 'OWNER' } ] });
  const T = (u) => generateAccessToken({ id: u.id, role: u.role });
  const [tO, tC, tO2] = [owner, cashier, owner2].map(T);
  try {
    let r = await call(tO, 'POST', `/shops/${shop.id}/expenses`, { amount: 200, category: 'rent', note: 'november' });
    ck('owner records expense = 201', r.status === 201, r);
    const eid = r.json?.data?.expense?.id;
    r = await call(tC, 'POST', `/shops/${shop.id}/expenses`, { amount: 50 });
    ck('cashier cannot record expense = 403', r.status === 403, r);
    r = await call(tO2, 'POST', `/shops/${shop.id}/expenses`, { amount: 50 });
    ck("other shop's owner cannot write to my shop = 403", r.status === 403, r);
    r = await call(tO, 'POST', `/shops/${shop.id}/expenses`, { amount: -5 });
    ck('negative amount rejected (4xx)', r.status >= 400 && r.status < 500, r);
    r = await call(tO, 'POST', `/shops/${shop.id}/expenses`, { amount: 0 });
    ck('zero amount rejected (4xx)', r.status >= 400 && r.status < 500, r);
    await call(tO, 'POST', `/shops/${shop.id}/expenses`, { amount: 300, category: 'salary' });
    r = await call(tO, 'GET', `/shops/${shop.id}/expenses`);
    ck('owner lists 2 expenses, total 500', r.status === 200 && r.json?.data?.expenses?.length === 2 && r.json?.data?.total === 500, r);
    r = await call(tC, 'GET', `/shops/${shop.id}/expenses`);
    ck('cashier cannot list expenses = 403', r.status === 403, r);
    r = await call(tO, 'GET', `/shops/${shop.id}/expenses?from=2999-01-01`);
    ck('date filter in the future -> empty, total 0', r.json?.data?.expenses?.length === 0 && r.json?.data?.total === 0, r);
    // net profit in summary: one sale with profit 500 -> net = 500 - 500 = 0; make profit visible
    const prod = await prisma.product.create({ data: { name: MARK + '-p', slug: MARK + '-p', price: 1500, finalPrice: 1500, buyPrice: 1000, sellPrice: 1500, stock: 10, ownerId: owner.id, createdById: owner.id, shopId: shop.id, isActive: true } });
    r = await call(tO, 'POST', '/sales', { product: prod.id, productName: 'p', quantity: 4, sellPrice: 1500, buyPrice: 1000 });
    ck('owner records sale (profit 2000) = 201', r.status === 201, r);
    r = await call(tO, 'GET', '/reports/summary');
    const s = r.json?.data?.summary || r.json?.data;
    ck('owner summary: expenses=500, netProfit=profit-500', s?.allTime?.expenses === 500 && s?.allTime?.netProfit === s?.allTime?.totalProfit - 500, s?.allTime);
    r = await call(tC, 'GET', '/reports/summary');
    const sc = r.json?.data?.summary || r.json?.data;
    ck('cashier summary has NO expenses / netProfit', sc?.allTime && sc.allTime.expenses === undefined && sc.allTime.netProfit === undefined, sc?.allTime);
    r = await call(tC, 'DELETE', `/shops/${shop.id}/expenses/${eid}`);
    ck('cashier delete expense = 403', r.status === 403, r);
    r = await call(tO2, 'DELETE', `/shops/${shop2.id}/expenses/${eid}`);
    ck("owner2 deleting an expense of ANOTHER shop via own shopId = 404", r.status === 404, r);
    r = await call(tO, 'DELETE', `/shops/${shop.id}/expenses/${eid}`);
    ck('owner deletes expense = 200', r.status === 200, r);
    // audit trail
    await call(tO, 'PATCH', `/products/${prod.id}/restock`, { quantity: 7 });
    const c = await call(tO, 'POST', '/products', { name: MARK + '-n', buyPrice: 1, sellPrice: 2, shopId: shop.id, stock: 1 });
    const nid = c.json?.data?.product?.id || c.json?.data?.id;
    await call(tO, 'DELETE', `/products/${nid}`);
    await new Promise((res) => setTimeout(res, 400));
    const logs = await prisma.auditLog.findMany({ where: { actorId: owner.id }, select: { action: true, metadata: true } });
    const acts = logs.map((l) => l.action);
    ['EXPENSE_CREATE', 'EXPENSE_DELETE', 'PRODUCT_RESTOCK', 'PRODUCT_CREATE', 'PRODUCT_DELETE'].forEach((a) =>
      ck(`audit log has ${a}`, acts.includes(a), acts));
    const rs = logs.find((l) => l.action === 'PRODUCT_RESTOCK');
    ck('restock audit records quantity 7 and stock 6 -> 13', rs?.metadata?.quantity === 7 && rs?.metadata?.stockBefore === 6 && rs?.metadata?.stockAfter === 13, rs);
  } finally {
    await prisma.auditLog.deleteMany({ where: { actorId: { in: [owner.id, cashier.id, owner2.id] } } });
    await prisma.sale.deleteMany({ where: { shopId: { in: [shop.id, shop2.id] } } });
    await prisma.product.deleteMany({ where: { shopId: { in: [shop.id, shop2.id] } } });
    await prisma.expense.deleteMany({ where: { shopId: { in: [shop.id, shop2.id] } } });
    await prisma.shopMember.deleteMany({ where: { shopId: { in: [shop.id, shop2.id] } } });
    await prisma.shop.deleteMany({ where: { id: { in: [shop.id, shop2.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, cashier.id, owner2.id] } } });
    console.log(`${pass} passed, ${fail} failed`);
    await prisma.$disconnect();
    process.exit(fail ? 1 : 0);
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
