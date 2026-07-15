require('dotenv').config();
const prisma = require('./config/prisma');
const bcrypt = require('bcryptjs');

// Super Admin is n1565559@gmail.com (promoted from a real user account) — not seeded here.
// The seed password is taken from the environment so it never lives in source or logs.
const seedPassword = process.env.ADMIN_SEED_PASSWORD;

const admins = [
  {
    name: 'Admin',
    email: 'admin@savdo.uz',
    password: seedPassword,
    role: 'ADMIN',
  },
];

async function seed() {
  if (!seedPassword) {
    console.error('ADMIN_SEED_PASSWORD is not set — refusing to seed with an empty/default password.');
    process.exit(1);
  }

  console.log('Seeding admins...');

  for (const data of admins) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      console.log(`Already exists: ${data.email} (${data.role})`);
      continue;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
    console.log(`Created: ${data.email} (${data.role})`);
  }

  await prisma.$disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
