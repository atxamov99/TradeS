// Live check: an admin changes what an account is (user / director / cashier / admin) from the panel.
require('dotenv').config();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) { console.error('not local'); process.exit(2); }
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/generateTokens');
const { deriveKind } = require('../src/utils/accountKind');
const BASE = process.env.VERIFY_BASE || 'http://localhost:5000/api/v1';
const MARK = 'ak-' + Date.now();
let pass = 0, fail = 0;
const ck = (l, c, x) => { c ? (pass++, console.log('PASS ', l)) : (fail++, console.log('FAIL ', l, JSON.stringify(x).slice(0, 220))); };
const call = async (t, m, p, b) => { const r = await fetch(BASE + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j }; };
const hash = bcrypt.hashSync('Test12345Aa', 4);
const mk = (n, extra = {}) => prisma.user.create({ data: { name: MARK + n, email: MARK + '-' + n + '@example.com', password: hash, role: 'USER', ...extra } });
const kindOf = async (id) => {
  const u = await prisma.user.findUnique({ where: { id }, include: { shopMemberships: { include: { shop: true } } } });
  return deriveKind(u, u.shopMemberships);
};
const T = (u) => generateAccessToken({ id: u.id, role: u.role });
(async () => {
  const ids = [];
  const main = await mk('main', { role: 'ADMIN', createdAt: new Date('2000-01-01') });
  const second = await mk('second', { role: 'ADMIN', createdAt: new Date('2000-01-02') });
  const person = await mk('person');
  const boss = await mk('boss');
  const staff = await mk('staff');
  const rich = await mk('rich');
  ids.push(main.id, second.id, person.id, boss.id, staff.id, rich.id);
  const tM = T(main), tS = T(second), tP = T(person);
  const shops = [];
  try {
    // a business with an employee, and a person with a personal shop that holds data
    const bizShop = await prisma.shop.create({ data: { name: MARK + '-biz', ownerId: boss.id, isBusiness: true, members: { create: [{ userId: boss.id, role: 'OWNER' }, { userId: staff.id, role: 'CASHIER' }] } } });
    const richShop = await prisma.shop.create({ data: { name: MARK + '-rich', ownerId: rich.id, isBusiness: false, members: { create: { userId: rich.id, role: 'OWNER' } } } });
    await prisma.product.create({ data: { name: MARK + '-p', slug: MARK + '-p', price: 1, finalPrice: 1, buyPrice: 1, sellPrice: 1, stock: 1, shopId: richShop.id, ownerId: rich.id, createdById: rich.id } });
    shops.push(bizShop.id, richShop.id);

    let r = await call(tM, 'GET', '/admin/users?limit=100');
    const row = (r.j?.data?.users || []).find((u) => u.id === boss.id);
    ck('users list tells the kind of each account (director) and the shop', row && row.accountKind === 'DIRECTOR' && row.shopName === MARK + '-biz', row && { k: row.accountKind, s: row.shopName });
    const rowStaff = (r.j?.data?.users || []).find((u) => u.id === staff.id);
    ck('users list: a cashier shows the shop he works in', rowStaff && rowStaff.accountKind === 'CASHIER' && rowStaff.shopName === MARK + '-biz', rowStaff && rowStaff.accountKind);
    r = await call(tM, 'GET', '/admin/shops');
    ck('admin can list business shops for the cashier picker', r.s === 200 && r.j?.data?.shops?.some((s) => s.id === bizShop.id && s.ownerName), r.s);

    // USER -> DIRECTOR (a personal shop does not exist yet: a business shop is created)
    r = await call(tM, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'DIRECTOR' });
    ck('USER -> DIRECTOR', r.s === 200 && (await kindOf(person.id)) === 'DIRECTOR', r);
    // DIRECTOR -> CASHIER of the other business
    r = await call(tM, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'CASHIER' });
    ck('CASHIER without a shop is refused (400)', r.s === 400, r);
    r = await call(tM, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'CASHIER', shopId: bizShop.id });
    ck('DIRECTOR -> CASHIER of a chosen shop', r.s === 200 && (await kindOf(person.id)) === 'CASHIER', r);
    const mem = await prisma.shopMember.findMany({ where: { userId: person.id } });
    ck('he is only a cashier now (his empty own shop was removed)', mem.length === 1 && mem[0].role === 'CASHIER' && mem[0].shopId === bizShop.id, mem);
    // CASHIER -> USER
    r = await call(tM, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'USER' });
    ck('CASHIER -> USER removes the cashier link', r.s === 200 && (await kindOf(person.id)) === 'USER' && (await prisma.shopMember.count({ where: { userId: person.id, role: 'CASHIER' } })) === 0, r);
    // USER -> DIRECTOR -> USER
    r = await call(tM, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'DIRECTOR' });
    ck('USER -> DIRECTOR again', r.s === 200 && (await kindOf(person.id)) === 'DIRECTOR', r);
    r = await call(tM, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'USER' });
    ck('DIRECTOR without employees -> USER', r.s === 200 && (await kindOf(person.id)) === 'USER', r);

    // safety nets
    r = await call(tM, 'PATCH', '/admin/users/' + boss.id + '/account-kind', { kind: 'USER' });
    ck('a director WITH employees cannot be turned into a user (409)', r.s === 409 && r.j?.code === 'DIRECTOR_HAS_STAFF', r);
    ck('...and he is still a director', (await kindOf(boss.id)) === 'DIRECTOR');
    r = await call(tM, 'PATCH', '/admin/users/' + rich.id + '/account-kind', { kind: 'CASHIER', shopId: bizShop.id });
    ck('a person whose shop holds data cannot become a cashier (409)', r.s === 409 && r.j?.code === 'HAS_OWN_SHOP_DATA', r);
    ck('...and his shop and products are still there', (await prisma.product.count({ where: { shopId: richShop.id } })) === 1);
    r = await call(tM, 'PATCH', '/admin/users/' + boss.id + '/account-kind', { kind: 'CASHIER', shopId: bizShop.id });
    ck('an owner cannot be the cashier of his own shop', r.s >= 400, r);
    r = await call(tM, 'PATCH', '/admin/users/' + staff.id + '/account-kind', { kind: 'NONSENSE' });
    ck('unknown role is refused (4xx)', r.s === 422 || r.s === 400, r.s);

    // ADMIN
    r = await call(tS, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'ADMIN' });
    ck('a non-main admin cannot make an admin', r.s === 403 && (await kindOf(person.id)) === 'USER', r);
    r = await call(tP, 'PATCH', '/admin/users/' + staff.id + '/account-kind', { kind: 'ADMIN' });
    ck('a normal user cannot change roles at all', r.s === 403, r);
    r = await call(tM, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'ADMIN' });
    ck('main admin: USER -> ADMIN', r.s === 200 && (await kindOf(person.id)) === 'ADMIN', r);
    r = await call(tS, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'USER' });
    ck('a non-main admin cannot demote an admin', r.s === 403, r);
    r = await call(tM, 'PATCH', '/admin/users/' + person.id + '/account-kind', { kind: 'USER' });
    ck('main admin: ADMIN -> USER', r.s === 200 && (await kindOf(person.id)) === 'USER', r);
    r = await call(tM, 'PATCH', '/admin/users/' + main.id + '/account-kind', { kind: 'USER' });
    ck('the main admin cannot change his own role', r.s === 400, r);
    r = await call(tS, 'PATCH', '/admin/users/' + main.id + '/account-kind', { kind: 'USER' });
    ck('nobody can demote the main admin', r.s === 403, r);
    ck('the audit log records the role changes', (await prisma.auditLog.count({ where: { action: 'ROLE_CHANGED', actorId: main.id } })) >= 5);
  } finally {
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { actor: { contains: MARK } }] } }).catch(() => {});
    await prisma.product.deleteMany({ where: { OR: [{ shopId: { in: shops } }, { ownerId: { in: ids } }] } });
    await prisma.shopMember.deleteMany({ where: { userId: { in: ids } } });
    await prisma.shop.deleteMany({ where: { OR: [{ ownerId: { in: ids } }, { id: { in: shops } }] } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
  console.log(pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
