// One-off, additive migration of an OLD local database (savdo_db) to the current schema.
// 1) JSON backup of every table  2) schema changes in ONE transaction (familyId in 3 steps)
// 3) backfill: personal shop for every product/sale owner, attach their products/sales.
// Safe to re-run (IF NOT EXISTS / skips existing). Refuses a non-local database.
// Usage: node scripts/migrate-savdo-db.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const url = process.env.DATABASE_URL || '';
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) { console.error('Refusing: DATABASE_URL is not local'); process.exit(1); }

async function backup() {
  const tables = await prisma.$queryRawUnsafe(`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`);
  const out = {};
  for (const { table_name } of tables) out[table_name] = await prisma.$queryRawUnsafe(`select * from "${table_name}"`);
  const dir = path.join(__dirname, '..', '..', '.backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `savdo_db-before-migration-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(out, (k, v) => (typeof v === 'bigint' ? Number(v) : v)));
  console.log('Backup:', file, Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])));
}

async function main() {
  await backup();
  await prisma.$transaction(async (tx) => {
    const x = (s) => tx.$executeRawUnsafe(s);
    // familyId: nullable -> fill -> NOT NULL
    await x(`ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "familyId" TEXT`);
    const rows = await tx.$queryRawUnsafe(`select id from "RefreshToken" where "familyId" is null`);
    for (const r of rows) await tx.$executeRawUnsafe(`update "RefreshToken" set "familyId"=$1 where id=$2`, crypto.randomUUID(), r.id);
    await x(`ALTER TABLE "RefreshToken" ALTER COLUMN "familyId" SET NOT NULL`);
    await x(`ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "isBusiness" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN IF NOT EXISTS "upgradeAttempts" INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "upgradeCodeExpiresAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "upgradeCodeHash" TEXT`);
    await x(`ALTER TABLE "SupportMessage" ADD COLUMN IF NOT EXISTS "adminReply" TEXT, ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "repliedBy" TEXT, ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'web', ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'open', ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT`);
    await x(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginCodeEnabled" BOOLEAN NOT NULL DEFAULT true`);
    await x(`CREATE TABLE IF NOT EXISTS "KnownDevice" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "deviceId" TEXT NOT NULL, "userAgent" TEXT NOT NULL DEFAULT '', "ip" TEXT NOT NULL DEFAULT '', "isPrimary" BOOLEAN NOT NULL DEFAULT false, "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "KnownDevice_pkey" PRIMARY KEY ("id"))`);
    await x(`CREATE INDEX IF NOT EXISTS "KnownDevice_userId_idx" ON "KnownDevice"("userId")`);
    await x(`CREATE UNIQUE INDEX IF NOT EXISTS "KnownDevice_userId_deviceId_key" ON "KnownDevice"("userId","deviceId")`);
    await x(`CREATE INDEX IF NOT EXISTS "RefreshToken_userId_isRevoked_idx" ON "RefreshToken"("userId","isRevoked")`);
    await x(`CREATE INDEX IF NOT EXISTS "RefreshToken_familyId_idx" ON "RefreshToken"("familyId")`);
    await x(`CREATE INDEX IF NOT EXISTS "SupportMessage_status_idx" ON "SupportMessage"("status")`);
    const fk = await tx.$queryRawUnsafe(`select 1 from pg_constraint where conname='KnownDevice_userId_fkey'`);
    if (!fk.length) await x(`ALTER TABLE "KnownDevice" ADD CONSTRAINT "KnownDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);

    // backfill: solo owners get a PERSONAL shop (isBusiness=false), their orphan products/sales attach to it
    const owners = await tx.$queryRawUnsafe(`select distinct "ownerId" as uid from "Product" where "shopId" is null and "ownerId" is not null union select distinct "userId" from "Sale" where "shopId" is null`);
    for (const { uid } of owners) {
      const u = (await tx.$queryRawUnsafe(`select name from "User" where id=$1`, uid))[0];
      if (!u) continue;
      let shop = (await tx.$queryRawUnsafe(`select m."shopId" from "ShopMember" m where m."userId"=$1 limit 1`, uid))[0]?.shopId;
      if (!shop) {
        shop = 'c' + crypto.randomBytes(12).toString('hex');
        await tx.$executeRawUnsafe(`insert into "Shop"(id,name,"isBusiness","ownerId","updatedAt") values($1,$2,false,$3,now())`, shop, u.name || "Shaxsiy do'kon", uid);
        await tx.$executeRawUnsafe(`insert into "ShopMember"(id,"shopId","userId",role) values($1,$2,$3,'OWNER')`, 'c' + crypto.randomBytes(12).toString('hex'), shop, uid);
      }
      await tx.$executeRawUnsafe(`update "Product" set "shopId"=$1 where "ownerId"=$2 and "shopId" is null`, shop, uid);
      await tx.$executeRawUnsafe(`update "Sale" set "shopId"=$1, "cashierId"=coalesce("cashierId",$2) where "userId"=$2 and "shopId" is null`, shop, uid);
      console.log('personal shop for', uid);
    }
  });
  console.log('Migration OK');
}
main().catch((e) => { console.error('FAILED (transaction rolled back):', e); process.exit(1); }).finally(() => prisma.$disconnect());
