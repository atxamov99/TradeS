// One-off live verification (no test framework in this repo): the "works for
// myself" (personal shop) model, the solo -> business upgrade with a one-time
// code, and that employees/business tools stay locked until then.
require('dotenv').config();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('Refusing to run: DATABASE_URL is not a local database (this script creates and deletes test rows).');
  process.exit(2);
}
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/generateTokens');
const BASE = process.env.VERIFY_BASE || 'http://localhost:5055/api/v1';
const MARK = 'verify-solo-' + Date.now();
let pass = 0, fail = 0;
const ck = (l, c, x) => { c ? (pass++, console.log('PASS ', l)) : (fail++, console.log('FAIL ', l, x !== undefined ? JSON.stringify(x).slice(0, 220) : '')); };
const call = async (token, method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const mkUser = (n) => prisma.user.create({ data: { name: MARK + n, email: `${MARK}-${n}@example.com`, password: 'x', role: 'USER' } });
const T = (u) => generateAccessToken({ id: u.id, role: u.role });

(async () => {
  const [solo, other, helper] = await Promise.all(['solo', 'other', 'helper'].map(mkUser));
  const tS = T(solo), tO = T(other), tH = T(helper);
  const created = { users: [solo.id, other.id, helper.id] };
  try {
    // 1. a user with no shop can work for themselves right away
    let r = await call(tS, 'POST', '/products', { name: MARK + '-p', buyPrice: 1000, sellPrice: 1500, stock: 10, barcode: 'SOLO-1' });
    ck('solo user creates a product with no shop = 201 (no "join a shop" error)', r.status === 201, r);
    const pid = r.json?.data?.product?.id || r.json?.data?.id;
    const mem = await prisma.shopMember.findMany({ where: { userId: solo.id }, include: { shop: true } });
    ck('a PERSONAL shop was auto-created (isBusiness=false, user is OWNER)', mem.length === 1 && mem[0].role === 'OWNER' && mem[0].shop.isBusiness === false, mem);
    const shopId = mem[0]?.shopId;
    r = await call(tS, 'POST', '/sales', { product: pid, productName: 'p', quantity: 2, sellPrice: 1500, buyPrice: 1000 });
    ck('solo user records a sale = 201', r.status === 201, r);
    r = await call(tS, 'GET', '/reports/summary');
    const sm = r.json?.data?.summary || r.json?.data;
    ck('solo user sees their own revenue/profit', sm?.allTime?.totalRevenue === 3000 && sm?.allTime?.totalProfit === 1000, sm?.allTime);
    r = await call(tO, 'GET', '/products/barcode/SOLO-1');
    ck("another user cannot find the solo user's product by barcode", !(r.status === 200 && r.json?.data?.product?.id === pid), r);

    // 2. no employees / business tools for a personal shop
    r = await call(tS, 'POST', `/shops/${shopId}/members`, { email: `${MARK}-helper@example.com` });
    ck('adding an employee to a PERSONAL shop = 409 PERSONAL_SHOP', r.status === 409 && r.json?.code === 'PERSONAL_SHOP', r);
    r = await call(tS, 'GET', `/shops/${shopId}/members`);
    ck('employee list of a PERSONAL shop = 409 PERSONAL_SHOP', r.status === 409 && r.json?.code === 'PERSONAL_SHOP', r);

    // 3. upgrade: only the owner, code required
    r = await call(tH, 'POST', `/shops/${shopId}/upgrade/request`);
    ck('a stranger cannot request the upgrade code = 403', r.status === 403, r);
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/confirm`, { code: '123456' });
    ck('confirming without requesting a code first = 400 NO_CODE_REQUESTED', r.status === 400 && r.json?.code === 'NO_CODE_REQUESTED', r);
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/request`);
    const devCode = r.json?.data?.devCode;
    ck('owner requests a code = 200 (dev mode returns devCode)', r.status === 200 && /^\d{6}$/.test(devCode || ''), r);
    let row = await prisma.shop.findUnique({ where: { id: shopId } });
    ck('the code is stored only as a hash', !!row.upgradeCodeHash && row.upgradeCodeHash !== devCode && row.upgradeCodeHash.length === 64, row.upgradeCodeHash);
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/confirm`, { code: devCode === '000000' ? '111111' : '000000' });
    ck('wrong code = 400 WRONG_CODE', r.status === 400 && r.json?.code === 'WRONG_CODE', r);
    for (let i = 0; i < 4; i++) await call(tS, 'POST', `/shops/${shopId}/upgrade/confirm`, { code: '000001' });
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/confirm`, { code: devCode });
    ck('after 5 wrong attempts even the right code is refused = 429', r.status === 429, r);
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/request`);
    const code2 = r.json?.data?.devCode;
    await prisma.shop.update({ where: { id: shopId }, data: { upgradeCodeExpiresAt: new Date(Date.now() - 1000) } });
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/confirm`, { code: code2 });
    ck('expired code = 400 CODE_EXPIRED', r.status === 400 && r.json?.code === 'CODE_EXPIRED', r);
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/request`);
    const code3 = r.json?.data?.devCode;
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/confirm`, { code: 'abc' });
    ck('malformed code rejected by validation (4xx)', r.status >= 400 && r.status < 500, r);
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/confirm`, { code: code3, name: MARK + ' Business' });
    ck('correct code upgrades the shop = 200', r.status === 200 && r.json?.data?.shop?.isBusiness === true, r);
    row = await prisma.shop.findUnique({ where: { id: shopId } });
    ck('code fields cleared after upgrade, name updated', row.upgradeCodeHash === null && row.upgradeAttempts === 0 && row.name.endsWith('Business'), row);
    r = await call(tS, 'POST', `/shops/${shopId}/upgrade/request`);
    ck('upgrading an already-business shop = 409 ALREADY_BUSINESS', r.status === 409 && r.json?.code === 'ALREADY_BUSINESS', r);

    // 4. now employees are allowed
    r = await call(tS, 'POST', `/shops/${shopId}/members`, { email: `${MARK}-helper@example.com` });
    ck('business owner can add an employee = 201', r.status === 201, r);
    r = await call(tS, 'GET', `/shops/${shopId}/members`);
    ck('business owner sees the employee list = 200 with 2 members', r.status === 200 && r.json?.data?.members?.length === 2, r);
    r = await call(tH, 'POST', '/products', { name: MARK + '-h', buyPrice: 1, sellPrice: 2, stock: 1 });
    ck('a cashier with no own shop cannot create products = 403 OWNER_ONLY', r.status === 403 && r.json?.code === 'OWNER_ONLY', r);

    // 5. registration: personal shop by default, business shop for OWNER
    const email = `${MARK}-reg@example.com`;
    await call(null, 'POST', '/auth/request-email-otp', { email });
    const rec = await prisma.emailAuth.findUnique({ where: { email } });
    r = await call(null, 'POST', '/auth/verify-email-otp', { email, code: rec.otpCode, name: MARK + 'reg', password: 'TestPass123' });
    ck('plain signup gets a personal shop (isBusiness=false)', r.status === 200 && r.json?.data?.shop?.isBusiness === false, r);
    const email2 = `${MARK}-reg2@example.com`;
    await call(null, 'POST', '/auth/request-email-otp', { email: email2 });
    const rec2 = await prisma.emailAuth.findUnique({ where: { email: email2 } });
    r = await call(null, 'POST', '/auth/verify-email-otp', { email: email2, code: rec2.otpCode, name: MARK + 'reg2', password: 'TestPass123', accountType: 'OWNER', shopName: MARK + ' Owner Shop' });
    ck('OWNER signup gets a business shop (isBusiness=true)', r.status === 200 && r.json?.data?.shop?.isBusiness === true, r);
  } finally {
    const regUsers = await prisma.user.findMany({ where: { email: { startsWith: MARK } }, select: { id: true } });
    const allUsers = [...new Set([...created.users, ...regUsers.map((u) => u.id)])];
    const shops = await prisma.shop.findMany({ where: { OR: [{ ownerId: { in: allUsers } }, { name: { startsWith: MARK } }] }, select: { id: true } });
    const ids = shops.map((s) => s.id);
    await prisma.auditLog.deleteMany({ where: { actorId: { in: allUsers } } });
    await prisma.sale.deleteMany({ where: { shopId: { in: ids } } });
    await prisma.product.deleteMany({ where: { shopId: { in: ids } } });
    await prisma.expense.deleteMany({ where: { shopId: { in: ids } } });
    await prisma.shopMember.deleteMany({ where: { shopId: { in: ids } } });
    await prisma.shop.deleteMany({ where: { id: { in: ids } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: allUsers } } }).catch(() => {});
    await prisma.knownDevice.deleteMany({ where: { userId: { in: allUsers } } }).catch(() => {});
    await prisma.emailAuth.deleteMany({ where: { email: { startsWith: MARK } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: allUsers } } });
    console.log(`${pass} passed, ${fail} failed`);
    await prisma.$disconnect();
    process.exit(fail ? 1 : 0);
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
