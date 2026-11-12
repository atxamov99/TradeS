// One-off live verification (no test framework in this repo — see CLAUDE.md).
// Exercises the real HTTP server for: (1) choosing OWNER at signup creates a
// Shop, (2) choosing USER (default) creates no shop, (3) that owner can add
// the plain user as a cashier by email lookup, (4) /auth/me then reflects it.
require('dotenv').config();
const prisma = require('../src/config/prisma');

const BASE = 'http://localhost:5000/api/v1';
const MARK = 'tmp-verify-signup-2026-07-26';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${label}`); }
  else { fail++; console.log(`FAIL  ${label}  ${extra ? JSON.stringify(extra) : ''}`); }
}

async function call(token, method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

async function main() {
  const ownerEmail = `${MARK}-owner@example.com`;
  const cashierEmail = `${MARK}-cashier@example.com`;

  try {
    // 1. Request + read email OTP for the owner-to-be
    await call(null, 'POST', '/auth/request-email-otp', { email: ownerEmail });
    let record = await prisma.emailAuth.findUnique({ where: { email: ownerEmail } });
    check('owner OTP was generated', !!record?.otpCode, record);

    let r = await call(null, 'POST', '/auth/verify-email-otp', {
      email: ownerEmail, code: record.otpCode, name: MARK + '-owner', password: 'TestPass123',
      accountType: 'OWNER', shopName: MARK + '-shop',
    });
    check('OWNER signup = 200', r.status === 200, r);
    check('OWNER signup returned a shop', !!r.json?.data?.shop?.id, r);
    const ownerToken = r.json?.data?.accessToken;
    const shopId = r.json?.data?.shop?.id;

    // 2. Plain USER signup (no accountType sent — default) creates no shop
    await call(null, 'POST', '/auth/request-email-otp', { email: cashierEmail });
    record = await prisma.emailAuth.findUnique({ where: { email: cashierEmail } });
    r = await call(null, 'POST', '/auth/verify-email-otp', {
      email: cashierEmail, code: record.otpCode, name: MARK + '-cashier', password: 'TestPass123',
    });
    check('plain USER signup = 200', r.status === 200, r);
    check('plain USER signup gets a PERSONAL shop (not a business)', r.json?.data?.shop?.isBusiness === false, r);

    // 3. The owner looks the cashier-to-be up by email and adds them
    r = await call(ownerToken, 'POST', `/shops/${shopId}/members`, { email: cashierEmail });
    check('owner adds cashier by email = 201', r.status === 201, r);
    check('added member defaults to CASHIER role', r.json?.data?.member?.role === 'CASHIER', r);

    // 4. The cashier's own /auth/me now reflects the membership
    const cashierLogin = await call(null, 'POST', '/auth/login', { email: cashierEmail, password: 'TestPass123' });
    const cashierToken = cashierLogin.json?.data?.accessToken;
    r = await call(cashierToken, 'GET', '/auth/me');
    const memberships = r.json?.data?.shopMemberships || [];
    check(
      '/auth/me shows the cashier membership with the right shop+role',
      memberships.some((m) => m.id === shopId && m.myRole === 'CASHIER'),
      memberships
    );

    // 5. Duplicate add attempt is rejected (already a member)
    r = await call(ownerToken, 'POST', `/shops/${shopId}/members`, { email: cashierEmail });
    check('adding the same cashier twice = 409', r.status === 409, r);

    // 6. Adding a non-existent person is a clean 404, not a crash
    r = await call(ownerToken, 'POST', `/shops/${shopId}/members`, { email: `${MARK}-nobody@example.com` });
    check('adding an unregistered email = 404', r.status === 404, r);

    console.log(`\n${pass} passed, ${fail} failed`);
  } finally {
    await prisma.shopMember.deleteMany({ where: { shop: { name: { contains: MARK } } } });
    await prisma.shop.deleteMany({ where: { name: { contains: MARK } } });
    await prisma.user.deleteMany({ where: { email: { contains: MARK } } });
    await prisma.emailAuth.deleteMany({ where: { email: { contains: MARK } } });
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(1); });
