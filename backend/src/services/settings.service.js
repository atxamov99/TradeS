const prisma = require('../config/prisma');

// Generic key-value settings store. Each key holds an arbitrary JSON value so the
// admin panel can persist app config, the roles catalog, and the permission matrix
// without a dedicated table per feature.

const getAllSettings = async () => {
  const rows = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
};

const getSetting = async (key) => {
  const row = await prisma.setting.findUnique({ where: { key } });
  return { key, value: row ? row.value : null };
};

const upsertSetting = async (key, value) => {
  const row = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return { key: row.key, value: row.value };
};

module.exports = { getAllSettings, getSetting, upsertSetting };
