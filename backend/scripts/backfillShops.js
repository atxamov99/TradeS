// One-off migration script: give every existing "solo" account (someone with
// products and/or sales but no Shop yet) a Shop of their own, so the new
// Shop/ShopMember model doesn't silently orphan pre-existing data.
//
// Safe to re-run: skips users who already own a Shop.
//
// Usage: node scripts/backfillShops.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ownerIds = await prisma.product.findMany({
    where: { ownerId: { not: null } },
    distinct: ['ownerId'],
    select: { ownerId: true },
  });
  const saleUserIds = await prisma.sale.findMany({
    distinct: ['userId'],
    select: { userId: true },
  });

  const candidateIds = new Set([
    ...ownerIds.map((p) => p.ownerId),
    ...saleUserIds.map((s) => s.userId),
  ]);

  console.log(`Found ${candidateIds.size} user(s) with products/sales to check.`);

  let created = 0;
  let skipped = 0;

  for (const userId of candidateIds) {
    const existingShop = await prisma.shop.findFirst({ where: { ownerId: userId } });
    if (existingShop) {
      skipped++;
      continue;
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (!user) continue; // dangling id, shouldn't happen but don't crash the run

    const shop = await prisma.shop.create({
      data: {
        name: `${user.name}'ning do'koni`,
        ownerId: userId,
        members: { create: { userId, role: 'OWNER' } },
      },
    });

    await prisma.product.updateMany({
      where: { ownerId: userId, shopId: null },
      data: { shopId: shop.id },
    });

    await prisma.sale.updateMany({
      where: { userId, shopId: null },
      data: { shopId: shop.id, cashierId: userId },
    });

    created++;
    console.log(`Created shop "${shop.name}" (${shop.id}) for user ${userId}`);
  }

  console.log(`Done. Shops created: ${created}, already had one: ${skipped}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
