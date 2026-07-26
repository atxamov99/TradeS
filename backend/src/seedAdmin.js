require('dotenv').config();
const prisma = require('./config/prisma');
const bcrypt = require('bcryptjs');

// The real admin account is a promoted real user (see project docs) — not seeded
// here. This script is only the bootstrap/recovery path for local dev or a fresh
// environment with zero admins. There is exactly one ADMIN account allowed
// system-wide (owner decision) — no HTTP endpoint can create one, so this CLI
// script is the only way, and it refuses to run if an admin already exists.
// The seed password is taken from the environment so it never lives in source or logs.
const seedPassword = process.env.ADMIN_SEED_PASSWORD;
const setupKey = process.env.ADMIN_SETUP_KEY;

const admin = {
  name: 'Admin',
  email: 'admin@trades.uz',
  password: seedPassword,
  role: 'ADMIN',
};

async function seed() {
  if (!seedPassword) {
    console.error('ADMIN_SEED_PASSWORD is not set — refusing to seed with an empty/default password.');
    process.exit(1);
  }
  if (!setupKey || setupKey === 'change_me_to_random_64hex') {
    console.error('ADMIN_SETUP_KEY is not set (or still the placeholder) — refusing to bootstrap an admin.');
    process.exit(1);
  }

  const existingAdminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (existingAdminCount > 0) {
    console.log(`Refusing to seed: ${existingAdminCount} admin account(s) already exist. Exactly one admin is allowed system-wide.`);
    await prisma.$disconnect();
    return;
  }

  console.log('Seeding the sole admin account...');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(admin.password, salt);

  await prisma.user.create({
    data: { ...admin, password: hashedPassword },
  });
  console.log(`Created: ${admin.email} (${admin.role})`);

  await prisma.$disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
