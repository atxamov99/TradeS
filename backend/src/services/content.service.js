const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { clampLimit } = require('../utils/pagination');

const getContent = async ({ page = 1, limit = 20, type, status } = {}) => {
  const take = clampLimit(limit, 20);
  const skip = (Number(page) - 1) * take;
  const where = {};

  if (type) where.type = type;
  if (status) where.status = status;

  const [rows, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    }),
    prisma.content.count({ where }),
  ]);

  return { content: rows, total, page: Number(page), pages: Math.ceil(total / take) };
};

const createContent = async (data) => {
  return prisma.content.create({ data });
};

const updateContentStatus = async (id, status) => {
  try {
    return await prisma.content.update({
      where: { id },
      data: { status },
    });
  } catch {
    throw new ApiError(404, 'Content not found');
  }
};

const deleteContent = async (id) => {
  try {
    await prisma.content.delete({ where: { id } });
    return { message: 'Content deleted' };
  } catch {
    throw new ApiError(404, 'Content not found');
  }
};

module.exports = { getContent, createContent, updateContentStatus, deleteContent };
