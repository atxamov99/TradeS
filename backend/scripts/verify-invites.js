// Live verification: employees are INVITED and must accept (nobody is added directly).
require('dotenv').config();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('Refusing to run: DATABASE_URL is not a local database.');
  process.exit(2);
}
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/generateTokens');
const BASE = process.env.VERIFY_BASE || 'http://localhost:5000/api/v1';
const MARK = 'verify-inv-' + Date.now();
let pass = 0, fail = 0;
const ck = (l, c, x) => { c ? (pass++, console.log('PASS ', l)) : (fail++, console.log('FAIL ', l, x !== undefined ? JSON.stringify(x).slice(0, 240) : '')); };
const call = async (token, method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const mkUser = (n) => prisma.user.create({ data: { name: MARK + n, email: `${MARK}-${n}@example.com`, phone: '+99890' + String(Math.floor(Math.random() * 1e7)).padStart(7, '0'), password: 'x', role: 'USER' } });
const T = (u) => generateAccessToken({ id: u.id, role: u.role });

(async () => {
  const [owner, cashier, stranger, other] = await Promise.all(['owner', 'cashier', 'stranger', 'other'].map(mkUser));
  const [tO, tC, tS, tX] = [owner, cashier, stranger, other].map(T);
  const ids = [owner.id, cashier.id, stranger.id, other.id];
  let shopId;
  try {
    // owner has a business shop; the future cashier already has an EMPTY auto-created personal shop
    const shop = await prisma.shop.create({ data: { name: MARK + '-shop', ownerId: owner.id, isBusiness: true, members: { create: { userId: owner.id, role: 'OWNER' } } } });
    shopId = shop.id;
    let r = await call(tC, 'GET', '/auth/me');
    ck('cashier-to-be got an auto personal shop first', (r.json?.data?.shopMemberships || []).length === 1, r.json?.data?.shopMemberships);

    // 1. inviting does NOT add anyone
    r = await call(tO, 'POST', `/shops/${shopId}/invites`, { email: cashier.email });
    ck('owner invites an existing user = 201', r.status === 201 && r.json?.data?.invite?.status === 'PENDING', r);
    const inviteId = r.json?.data?.invite?.id;
    ck('invited user is NOT a member yet', !(await prisma.shopMember.findFirst({ where: { shopId, userId: cashier.id } })));
    r = await call(tO, 'GET', `/shops/${shopId}/members`);
    ck('member list still has only the owner', r.json?.data?.members?.length === 1, r.json?.data?.members?.length);

    // 2. checks before inviting
    r = await call(tO, 'POST', `/shops/${shopId}/invites`, { email: `${MARK}-nobody@example.com` });
    ck('unknown person (not in the database) = 404', r.status === 404, r);
    r = await call(tO, 'POST', `/shops/${shopId}/invites`, { email: cashier.email });
    ck('second invite while one is pending = 409', r.status === 409, r);
    r = await call(tO, 'POST', `/shops/${shopId}/invites`, { email: owner.email });
    ck('inviting yourself = 400', r.status === 400, r);
    r = await call(tS, 'POST', `/shops/${shopId}/invites`, { email: other.email });
    ck('a stranger cannot invite into the shop = 403', r.status === 403, r);
    r = await call(tC, 'POST', `/shops/${shopId}/members`, { email: other.email });
    ck('the old direct "add member" route is gone (not 2xx)', r.status >= 400, r);

    // 3. only the invited user sees / answers it
    r = await call(tC, 'GET', '/shops/invites/mine');
    ck('invited user sees the pending invitation', r.status === 200 && r.json?.data?.invites?.length === 1 && r.json.data.invites[0].shop?.name === MARK + '-shop', r);
    r = await call(tS, 'GET', '/shops/invites/mine');
    ck('a stranger sees no invitations', r.status === 200 && r.json?.data?.invites?.length === 0, r);
    r = await call(tS, 'POST', `/shops/invites/${inviteId}/accept`);
    ck('a stranger cannot accept someone else\'s invitation = 404', r.status === 404, r);
    r = await call(tO, 'POST', `/shops/invites/${inviteId}/accept`);
    ck('the owner cannot accept it on their behalf = 404', r.status === 404, r);
    ck('still not a member after those attempts', !(await prisma.shopMember.findFirst({ where: { shopId, userId: cashier.id } })));

    // 4. decline, then re-invite and accept
    r = await call(tC, 'POST', `/shops/invites/${inviteId}/decline`);
    ck('declining = 200', r.status === 200, r);
    r = await call(tC, 'POST', `/shops/invites/${inviteId}/accept`);
    ck('answering the same invitation twice = 404', r.status === 404, r);
    r = await call(tO, 'POST', `/shops/${shopId}/invites`, { phone: cashier.phone });
    ck('owner re-invites by phone = 201', r.status === 201, r);
    const inv2 = r.json?.data?.invite?.id;
    r = await call(tO, 'GET', `/shops/${shopId}/invites`);
    ck('owner sees the pending list (1)', r.json?.data?.invites?.length === 1, r);
    r = await call(tC, 'POST', `/shops/invites/${inv2}/accept`);
    ck('accepting = 200 and role CASHIER', r.status === 200 && r.json?.data?.role === 'CASHIER', r);
    ck('now a CASHIER member', (await prisma.shopMember.findFirst({ where: { shopId, userId: cashier.id } }))?.role === 'CASHIER');
    r = await call(tC, 'GET', '/auth/me');
    const ms = r.json?.data?.shopMemberships || [];
    ck('cashier /auth/me shows ONLY the business shop as CASHIER (empty personal shop removed)', ms.length === 1 && ms[0].id === shopId && ms[0].myRole === 'CASHIER', ms);
    r = await call(tO, 'POST', `/shops/${shopId}/invites`, { email: cashier.email });
    ck('inviting an existing member = 409', r.status === 409, r);

    // 5. cancel
    r = await call(tO, 'POST', `/shops/${shopId}/invites`, { email: other.email });
    const inv3 = r.json?.data?.invite?.id;
    r = await call(tS, 'DELETE', `/shops/${shopId}/invites/${inv3}`);
    ck('a stranger cannot cancel = 403', r.status === 403, r);
    r = await call(tO, 'DELETE', `/shops/${shopId}/invites/${inv3}`);
    ck('owner cancels = 200', r.status === 200, r);
    r = await call(tX, 'POST', `/shops/invites/${inv3}/accept`);
    ck('a cancelled invitation cannot be accepted = 404', r.status === 404, r);

    // 6. race: two accepts at once -> exactly one membership
    r = await call(tO, 'POST', `/shops/${shopId}/invites`, { email: other.email });
    const inv4 = r.json?.data?.invite?.id;
    const rs = await Promise.all([call(tX, 'POST', `/shops/invites/${inv4}/accept`), call(tX, 'POST', `/shops/invites/${inv4}/accept`)]);
    const n = await prisma.shopMember.count({ where: { shopId, userId: other.id } });
    ck('two parallel accepts -> exactly 1 membership, no 500', n === 1 && rs.every((x) => x.status < 500), { n, s: rs.map((x) => x.status) });
  } finally {
    await prisma.shopInvite.deleteMany({ where: { OR: [{ shopId: shopId || 'x' }, { invitedUserId: { in: ids } }] } });
    await prisma.shopMember.deleteMany({ where: { userId: { in: ids } } });
    await prisma.shop.deleteMany({ where: { OR: [{ ownerId: { in: ids } }, { id: shopId || 'x' }] } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.knownDevice.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
