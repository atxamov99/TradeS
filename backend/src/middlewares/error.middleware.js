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
      message = 'Related record not found';
      error = new ApiError(statusCode, message);
    }
    // Request-body problems raised by the body parser (malformed JSON, too large, bad encoding):
    // the CLIENT's fault, never a 500.
    else if (error.type === 'entity.too.large' || error.status === 413) {
      error = new ApiError(413, 'Request body is too large');
    } else if (error.type === 'entity.parse.failed' || error.type === 'encoding.unsupported' || error.type === 'charset.unsupported' || (error instanceof SyntaxError && error.status === 400)) {
      error = new ApiError(400, 'Malformed request body');
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

  // Log server errors (full detail stays in the log only)
  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${error.message}`, { stack: error.stack });
    // Unexpected errors must not leak internals (Prisma query text, file paths) to the client.
    // Deliberate ApiErrors with a 5xx (e.g. "Email yuborilmadi") keep their own message.
    if (!(err instanceof ApiError)) error.message = 'Internal Server Error';
  }

  res.status(error.statusCode || 500).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    code: error.code,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' && process.env.EXPOSE_STACK === '1' && { stack: error.stack }),
  });
};

module.exports = errorMiddleware;
