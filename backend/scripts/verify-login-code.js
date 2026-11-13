// One-off live verification (no test framework in this repo): Telegram sign-in code on every login,
// the password-protected opt-out, and that accounts without Telegram are not locked out.
require('dotenv').config();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('Refusing to run: DATABASE_URL is not a local database (this script creates and deletes test rows).');
  process.exit(2);
}
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');
const BASE = process.env.VERIFY_BASE || 'http://localhost:5055/api/v1';
const MARK = 'verify-logincode-' + Date.now();
const PHONE = '+99890' + String(Date.now()).slice(-7);
const PHONE_DIGITS = PHONE.replace('+', '');
const PASSWORD = 'TestPass123';
let pass = 0, fail = 0;
const ck = (l, c, x) => { c ? (pass++, console.log('PASS ', l)) : (fail++, console.log('FAIL ', l, x !== undefined ? JSON.stringify(x).slice(0, 220) : '')); };
const call = async (method, path, body, { dev, tok } = {}) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(dev ? { 'X-Device-Id': dev } : {}), ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const login = (dev, extra = {}) => call('POST', '/auth/login', { phone: PHONE, password: PASSWORD, ...extra }, { dev });

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.create({ data: { name: MARK, phone: PHONE, email: `${MARK}@example.com`, password: hash, role: 'USER' } });
  await prisma.phoneAuth.create({ data: { phone: PHONE_DIGITS, telegramChatId: '1' } });
  const noTg = await prisma.user.create({ data: { name: MARK + 'n', email: `${MARK}n@example.com`, password: hash, role: 'USER' } });
  try {
    // 1. every login is challenged (default on)
    let r = await login('dev-1');
    ck('login with Telegram linked -> code required, NO tokens', r.status === 200 && r.json?.data?.requiresDeviceConfirmation === true && !r.json?.data?.accessToken, r);
    ck('response says it is the every-login code', r.json?.data?.requiresLoginCode === true, r.json?.data);
    let rec = await prisma.phoneAuth.findUnique({ where: { phone: PHONE_DIGITS } });
    ck('a 6-digit code was generated', /^\d{6}$/.test(rec?.otpCode || ''), rec);
    const code = rec.otpCode;

    // 2. wrong then right code
    r = await call('POST', '/auth/verify-new-device', { phone: PHONE, password: PASSWORD, code: code === '000000' ? '111111' : '000000' }, { dev: 'dev-1' });
    ck('wrong code = 400', r.status === 400, r);
    r = await call('POST', '/auth/verify-new-device', { phone: PHONE, password: PASSWORD, code }, { dev: 'dev-1' });
    ck('right code -> tokens (signed in)', r.status === 200 && !!r.json?.data?.accessToken, r);
    const tok = r.json?.data?.accessToken;

    // 3. next login is challenged AGAIN even from the same, now-known device
    r = await login('dev-1');
    ck('second login from the SAME device is challenged again', r.json?.data?.requiresLoginCode === true && !r.json?.data?.accessToken, r);

    // 4. opting out needs the password
    r = await call('PATCH', '/users/security', { enabled: false }, { tok });
    ck('disable WITHOUT password = 401', r.status === 401, r);
    r = await call('PATCH', '/users/security', { enabled: false, password: 'nope-nope-1' }, { tok });
    ck('disable with WRONG password = 401', r.status === 401, r);
    r = await call('PATCH', '/users/security', { enabled: false, password: PASSWORD }, { tok });
    ck('disable with the right password = 200', r.status === 200 && r.json?.data?.loginCodeEnabled === false, r);
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    ck('flag stored as false', u.loginCodeEnabled === false, u.loginCodeEnabled);
    const audit = await prisma.auditLog.findFirst({ where: { actorId: user.id, action: 'LOGIN_CODE_DISABLED' } });
    ck('the change is written to the audit log', !!audit, audit);

    // 5. off: known device logs in directly, an UNKNOWN device is still challenged
    r = await login('dev-1');
    ck('code OFF + known device -> direct login with tokens', r.status === 200 && !!r.json?.data?.accessToken, r);
    r = await login('dev-2');
    ck('code OFF + UNKNOWN device -> still challenged (new-device rule)', r.json?.data?.requiresDeviceConfirmation === true && !r.json?.data?.accessToken, r);

    // 6. turning it back on needs no password
    const tok2 = (await login('dev-1')).json?.data?.accessToken;
    r = await call('PATCH', '/users/security', { enabled: true }, { tok: tok2 });
    ck('enable again (no password needed) = 200', r.status === 200 && r.json?.data?.loginCodeEnabled === true, r);
    r = await login('dev-1');
    ck('...and every login is challenged again', r.json?.data?.requiresLoginCode === true, r);

    // 7. no Telegram linked -> never locked out
    r = await call('POST', '/auth/login', { email: `${MARK}n@example.com`, password: PASSWORD }, { dev: 'dev-9' });
    ck('account WITHOUT Telegram can still sign in (fail-open)', r.status === 200 && !!r.json?.data?.accessToken, r);
  } finally {
    await prisma.auditLog.deleteMany({ where: { actorId: { in: [user.id, noTg.id] } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: [user.id, noTg.id] } } }).catch(() => {});
    await prisma.knownDevice.deleteMany({ where: { userId: { in: [user.id, noTg.id] } } }).catch(() => {});
    await prisma.phoneAuth.deleteMany({ where: { phone: PHONE_DIGITS } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, noTg.id] } } });
    console.log(`${pass} passed, ${fail} failed`);
    await prisma.$disconnect();
    process.exit(fail ? 1 : 0);
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
