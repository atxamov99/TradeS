// Local-only demo seed: one account per role + a shop with products, sales and
// expenses, so every role's pages have something to show.
//   user    — plain USER, no shop
//   owner   — shop OWNER ("director")
//   cashier — shop CASHIER
//   admin   — platform ADMIN
// All four use the same password (printed at the end). Safe to re-run: it
// removes its own previous demo data first. Refuses to touch a non-local DB.
require('dotenv').config();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('Refusing to run: DATABASE_URL is not a local database.');
  process.exit(2);
}
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

const PASSWORD = 'Demo12345';
const SHOP = 'Demo Market';
const PHONES = { user: '+998900000001', owner: '+998900000002', cashier: '+998900000003', admin: '+998900000004' };
const EMAILS = {
  user: 'demo.user@example.com',
  owner: 'demo.owner@example.com',
  cashier: 'demo.cashier@example.com',
  admin: 'demo.admin@example.com',
};

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { OR: [{ email: { in: Object.values(EMAILS) } }, { phone: { in: Object.values(PHONES) } }] },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  const shops = await prisma.shop.findMany({ where: { name: SHOP }, select: { id: true } });
  const shopIds = shops.map((s) => s.id);
  await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.sale.deleteMany({ where: { OR: [{ shopId: { in: shopIds } }, { userId: { in: ids } }] } });
  await prisma.product.deleteMany({ where: { OR: [{ shopId: { in: shopIds } }, { ownerId: { in: ids } }] } });
  await prisma.expense.deleteMany({ where: { shopId: { in: shopIds } } });
  await prisma.shopMember.deleteMany({ where: { shopId: { in: shopIds } } });
  await prisma.shop.deleteMany({ where: { id: { in: shopIds } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await cleanup();
  const hash = await bcrypt.hash(PASSWORD, 10);
  const mk = (name, key, role = 'USER') =>
    prisma.user.create({ data: { name, email: EMAILS[key], phone: PHONES[key], password: hash, role, isEmailVerified: true } });
  const user = await mk('Demo Foydalanuvchi', 'user');
  const owner = await mk('Demo Direktor', 'owner');
  const cashier = await mk('Demo Kassir', 'cashier');
  await mk('Demo Admin', 'admin', 'ADMIN');

  const shop = await prisma.shop.create({ data: { name: SHOP, ownerId: owner.id } });
  await prisma.shopMember.createMany({
    data: [
      { shopId: shop.id, userId: owner.id, role: 'OWNER' },
      { shopId: shop.id, userId: cashier.id, role: 'CASHIER' },
    ],
  });

  const catalogue = [
    ['Un 1 kg', 'kg', 9000, 12000, 40, '4780000000011'],
    ['Shakar 1 kg', 'kg', 11000, 14000, 25, '4780000000028'],
    ["Yog' 1 l", 'l', 16000, 21000, 3, '4780000000035'],
    ['Guruch 1 kg', 'kg', 14000, 18000, 60, '4780000000042'],
    ['Choy 100 g', 'pcs', 8000, 11000, 2, '4780000000059'],
  ];
  const products = [];
  for (const [name, unit, buy, sell, stock, barcode] of catalogue) {
    products.push(await prisma.product.create({
      data: {
        name, slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${products.length}`,
        price: sell, finalPrice: sell, buyPrice: buy, sellPrice: sell, stock, unit,
        barcode, ownerId: owner.id, createdById: owner.id, shopId: shop.id, isActive: true,
      },
    }));
  }

  const sale = (who, p, qty, daysAgo = 0) =>
    prisma.sale.create({
      data: {
        userId: who.id, cashierId: who.id, shopId: shop.id, productId: p.id, productName: p.name,
        quantity: qty, sellPrice: p.sellPrice, buyPrice: p.buyPrice,
        totalRevenue: qty * p.sellPrice, totalCost: qty * p.buyPrice, profit: qty * (p.sellPrice - p.buyPrice),
        createdAt: new Date(Date.now() - daysAgo * 86400000),
      },
    });
  await sale(cashier, products[0], 3); await sale(cashier, products[1], 2); await sale(cashier, products[3], 5);
  await sale(owner, products[2], 1); await sale(owner, products[0], 4, 1); await sale(cashier, products[4], 2, 2);
  await sale(cashier, products[1], 6, 3); await sale(owner, products[3], 8, 5);

  for (const [amount, category, note, d] of [[1500000, 'rent', 'Noyabr ijarasi', 3], [900000, 'salary', 'Kassir maoshi', 1], [120000, 'utilities', 'Elektr', 0]]) {
    await prisma.expense.create({ data: { shopId: shop.id, amount, category, note, createdById: owner.id, createdAt: new Date(Date.now() - d * 86400000) } });
  }

  console.log('Demo accounts (password for all: ' + PASSWORD + '):');
  for (const [k, v] of Object.entries(EMAILS)) console.log(`  ${k.padEnd(8)} ${PHONES[k]}   ${v}`);
  console.log(`Shop "${SHOP}" with ${products.length} products, 8 sales, 3 expenses. (plain user id ${user.id.slice(0, 6)}… has no shop)`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
