const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

/**
 * Protect routes — verifies JWT access token
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired');
    }
    throw new ApiError(401, 'Invalid token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user || user.deletedAt) {
    throw new ApiError(401, 'User belonging to this token no longer exists');
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Contact support.', [], '', 'ACCOUNT_BLOCKED');
  }

  // Remove password from user object
  const userResponse = { ...user };
  delete userResponse.password;

  req.user = userResponse;
  next();
});

module.exports = { protect };
