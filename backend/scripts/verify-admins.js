// Live check: only the MAIN admin (oldest ADMIN) can add/manage admins; nobody can touch the main admin;
// a support reply that cannot be delivered fails cleanly.
require('dotenv').config();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) { console.error('not local'); process.exit(2); }
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/generateTokens');
const BASE = process.env.VERIFY_BASE || 'http://localhost:5000/api/v1';
const MARK = 'va-' + Date.now();
let pass = 0, fail = 0;
const ck = (l, c, x) => { c ? (pass++, console.log('PASS ', l)) : (fail++, console.log('FAIL ', l, JSON.stringify(x).slice(0, 200))); };
const call = async (t, m, p, b) => { const r = await fetch(BASE + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j }; };
const hash = bcrypt.hashSync('Test12345Aa', 4);
(async () => {
  const ids = [];
  // "main" = the oldest ADMIN: make it older than everything else
  const main = await prisma.user.create({ data: { name: MARK + 'main', email: MARK + '-main@example.com', password: hash, role: 'ADMIN', createdAt: new Date('2000-01-01') } });
  const second = await prisma.user.create({ data: { name: MARK + 'second', email: MARK + '-second@example.com', password: hash, role: 'ADMIN', createdAt: new Date('2000-01-02') } });
  const plain = await prisma.user.create({ data: { name: MARK + 'plain', email: MARK + '-plain@example.com', password: hash, role: 'USER' } });
  ids.push(main.id, second.id, plain.id);
  const real = await prisma.user.findFirst({ where: { role: 'ADMIN', deletedAt: null }, orderBy: { createdAt: 'asc' } });
  const tM = generateAccessToken({ id: main.id, role: 'ADMIN' }), tS = generateAccessToken({ id: second.id, role: 'ADMIN' }), tP = generateAccessToken({ id: plain.id, role: 'USER' });
  let tick = null;
  try {
    ck('the oldest ADMIN is the main admin', real.id === main.id, real.id);
    let r = await call(tM, 'GET', '/admin/admins');
    ck('admins list marks the main admin', r.s === 200 && r.j?.data?.mainAdminId === main.id && r.j.data.users.some((u) => u.id === main.id && u.isMainAdmin), r.j?.data?.mainAdminId);
    r = await call(tM, 'POST', '/admin/users', { name: MARK + 'new', email: MARK + '-new@example.com', password: 'Passw0rdAa', role: 'ADMIN' });
    const newId = r.j?.data?.user?.id || r.j?.data?.id; if (newId) ids.push(newId);
    ck('main admin can ADD an admin', r.s === 201 || r.s === 200, r);
    const created = newId ? await prisma.user.findUnique({ where: { id: newId } }) : null;
    ck('the new account really has role ADMIN', created && created.role === 'ADMIN', created && created.role);
    r = await call(tS, 'POST', '/admin/users', { name: MARK + 'x', email: MARK + '-x@example.com', password: 'Passw0rdAa', role: 'ADMIN' });
    ck('a non-main admin CANNOT add an admin', r.s === 403, r);
    ck('no such account was created', !(await prisma.user.findFirst({ where: { email: MARK + '-x@example.com' } })));
    r = await call(tP, 'POST', '/admin/users', { name: MARK + 'y', email: MARK + '-y@example.com', password: 'Passw0rdAa', role: 'ADMIN' });
    ck('a normal user cannot reach the admin API at all', r.s === 403, r);
    r = await call(tS, 'PATCH', '/admin/users/' + plain.id, { role: 'ADMIN' });
    ck('a non-main admin cannot promote a user', r.s === 403, r);
    r = await call(tM, 'PATCH', '/admin/users/' + plain.id, { role: 'ADMIN' });
    const pr = await prisma.user.findUnique({ where: { id: plain.id } });
    ck('main admin can promote an existing user', r.s === 200 && pr.role === 'ADMIN', { s: r.s, role: pr.role });
    r = await call(tM, 'PATCH', '/admin/users/' + plain.id, { role: 'USER' });
    ck('main admin can revoke admin rights again', r.s === 200 && (await prisma.user.findUnique({ where: { id: plain.id } })).role === 'USER', r.s);
    r = await call(tS, 'PATCH', '/admin/users/' + main.id + '/block');
    ck('a non-main admin cannot block the main admin', r.s === 403, r);
    r = await call(tS, 'PATCH', '/admin/admins/' + main.id + '/status');
    ck('a non-main admin cannot toggle the main admin', r.s === 403, r);
    r = await call(tM, 'PATCH', '/admin/users/' + main.id + '/block');
    ck('the main admin cannot block himself', r.s >= 400, r.s);
    r = await call(tM, 'PATCH', '/admin/admins/' + second.id + '/status');
    ck('main admin can block another admin', r.s === 200 && (await prisma.user.findUnique({ where: { id: second.id } })).isBlocked === true, r);
    r = await call(tM, 'PATCH', '/admin/admins/' + second.id + '/status');
    ck('main admin can unblock another admin', r.s === 200 && (await prisma.user.findUnique({ where: { id: second.id } })).isBlocked === false, r);
    r = await call(tM, 'PATCH', '/admin/users/' + plain.id + '/block');
    ck('admin can block a normal user', r.s === 200 && (await prisma.user.findUnique({ where: { id: plain.id } })).isBlocked === true, r);
    r = await call(tM, 'PATCH', '/admin/users/' + plain.id + '/unblock');
    ck('admin can unblock a normal user', r.s === 200, r);
    r = await call(tM, 'POST', '/admin/users', { name: MARK + 'ph', phone: '+99890 1234567', password: 'Passw0rdAa', role: 'USER' });
    const phId = r.j?.data?.user?.id || r.j?.data?.id; if (phId) ids.push(phId);
    const phRow = phId ? await prisma.user.findUnique({ where: { id: phId } }) : null;
    ck('admin-created phone is stored in the canonical +digits form', phRow && phRow.phone === '+998901234567', phRow && phRow.phone);
    r = await call(tM, 'POST', '/admin/users', { name: MARK + 'ph2', phone: '+998 90 123 45 67', password: 'Passw0rdAa', role: 'USER' });
    ck('same phone written differently is refused (409)', r.s === 409, r);
    // the bug that hit a real test: promoting an account that is OLDER than the main admin must NOT make it the main admin
    const oldAcc = await prisma.user.create({ data: { name: MARK + 'old', email: MARK + '-old@example.com', password: hash, role: 'USER', createdAt: new Date('1999-01-01') } });
    ids.push(oldAcc.id);
    r = await call(tM, 'PATCH', '/admin/users/' + oldAcc.id, { role: 'ADMIN' });
    ck('promote an old account to admin', r.s === 200 && (await prisma.user.findUnique({ where: { id: oldAcc.id } })).role === 'ADMIN', r);
    r = await call(tM, 'GET', '/admin/admins');
    ck('the main admin is STILL the same one (promotion by account age is not allowed to steal it)', r.j?.data?.mainAdminId === main.id, r.j?.data?.mainAdminId);
    ck('the promoted old account is a normal admin, not the main one', r.j?.data?.users?.some((u) => u.id === oldAcc.id && !u.isMainAdmin), r.j?.data?.users);
    const tOld = generateAccessToken({ id: oldAcc.id, role: 'ADMIN' });
    r = await call(tOld, 'PATCH', '/admin/admins/' + second.id + '/status');
    ck('the promoted admin cannot block other admins', r.s === 403, r);
    r = await call(tM, 'PATCH', '/admin/admins/' + oldAcc.id + '/status');
    ck('main admin can block the promoted admin', r.s === 200 && (await prisma.user.findUnique({ where: { id: oldAcc.id } })).isBlocked === true, r);
    r = await call(tM, 'PATCH', '/admin/admins/' + oldAcc.id + '/status');
    r = await call(tM, 'PATCH', '/admin/users/' + oldAcc.id + '/account-kind', { kind: 'USER' });
    const back = await prisma.user.findUnique({ where: { id: oldAcc.id } });
    ck('main admin can take the admin rights away again (round trip) and adminSince is cleared', r.s === 200 && back.role === 'USER' && back.adminSince === null, { s: r.s, role: back.role, since: back.adminSince });
    r = await call(tM, 'GET', '/admin/admins');
    ck('after the round trip the list has no trace of him and main is unchanged', r.j?.data?.mainAdminId === main.id && !r.j.data.users.some((u) => u.id === oldAcc.id), r.j?.data?.mainAdminId);
    r = await call(tOld, 'GET', '/admin/users');
    ck('a revoked admin is locked out of the admin API immediately (his old token still exists)', r.s === 403, r.s);

    // support reply that cannot be delivered
    tick = await prisma.supportMessage.create({ data: { name: MARK, contact: 'x', message: 'help', source: 'bot', telegramChatId: '1', status: 'open' } });
    r = await call(tM, 'POST', '/admin/support-messages/' + tick.id + '/reply', { reply: 'test' });
    const after = await prisma.supportMessage.findUnique({ where: { id: tick.id } });
    ck('undeliverable support reply = clean 502 (no internals) and ticket stays open', r.s === 502 && !/TOKEN|prisma/i.test(JSON.stringify(r.j)) && after.status === 'open', { s: r.s, m: r.j?.message, st: after.status });
  } finally {
    if (tick) await prisma.supportMessage.deleteMany({ where: { id: tick.id } });
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { actor: { contains: MARK } }] } }).catch(() => {});
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.shopMember.deleteMany({ where: { userId: { in: ids } } });
    await prisma.shop.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma.knownDevice.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
  console.log(pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
