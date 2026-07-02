const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { addresses: true },
  });
  if (!user) throw new ApiError(404, 'User not found');

  const userResponse = { ...user };
  delete userResponse.password;
  return userResponse;
};

const updateProfile = async (userId, updateData) => {
  const allowed = ['name', 'email', 'phone', 'avatar', 'telegram', 'instagram'];
  const filteredData = Object.keys(updateData)
    .filter((key) => allowed.includes(key))
    .reduce((obj, key) => ({ ...obj, [key]: updateData[key] }), {});

  const user = await prisma.user.update({
    where: { id: userId },
    data: filteredData,
  });
  if (!user) throw new ApiError(404, 'User not found');

  const userResponse = { ...user };
  delete userResponse.password;
  return userResponse;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: 'Password changed successfully' };
};

const addAddress = async (userId, addressData) => {
  return await prisma.$transaction(async (tx) => {
    if (addressData.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    await tx.address.create({
      data: {
        ...addressData,
        userId,
      },
    });

    return await tx.address.findMany({ where: { userId } });
  });
};

const updateAddress = async (userId, addressId, addressData) => {
  return await prisma.$transaction(async (tx) => {
    if (addressData.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // updateMany with {id, userId}: enforces ownership AND avoids Prisma's
    // unique-only `where` restriction on update(). count===0 → not the user's address.
    const result = await tx.address.updateMany({
      where: { id: addressId, userId },
      data: addressData,
    });
    if (result.count === 0) throw new ApiError(404, 'Address not found');

    return await tx.address.findMany({ where: { userId } });
  });
};

const deleteAddress = async (userId, addressId) => {
  const result = await prisma.address.deleteMany({
    where: { id: addressId, userId },
  });
  if (result.count === 0) throw new ApiError(404, 'Address not found');
  return await prisma.address.findMany({ where: { userId } });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
};
