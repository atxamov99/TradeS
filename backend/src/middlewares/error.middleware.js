const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Wrap non-ApiError instances
  if (!(error instanceof ApiError)) {
    let statusCode = 500;
    let message = error.message || 'Internal Server Error';

    // Prisma Unique constraint violation
    if (error.code === 'P2002') {
      statusCode = 409;
      const field = error.meta?.target?.[0] || 'field';
      message = `Duplicate value for '${field}'`;
      error = new ApiError(statusCode, message);
    }
    // Prisma Record not found
    else if (error.code === 'P2025') {
      statusCode = 404;
      message = error.meta?.cause || 'Record not found';
      error = new ApiError(statusCode, message);
    }
    // Prisma Foreign key constraint violation
    else if (error.code === 'P2003') {
      statusCode = 400;
      message = `Foreign key constraint failed on the field: ${error.meta?.field_name}`;
      error = new ApiError(statusCode, message);
    }
    // JWT errors
    else if (error.name === 'JsonWebTokenError') {
      error = new ApiError(401, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      error = new ApiError(401, 'Token has expired');
    } else {
      error = new ApiError(statusCode, message);
    }
  }

  // Log server errors
  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${error.message}`, { stack: error.stack });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    code: error.code,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = errorMiddleware;
