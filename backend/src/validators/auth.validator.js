const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase(),
  phone: Joi.string().trim(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
}).or('email', 'phone');

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase(),
  phone: Joi.string().trim(),
  password: Joi.string().required(),
}).or('email', 'phone');

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

// ── OTP / OAuth / password-reset ────────────────────────────────────────────

const googleSchema = Joi.object({
  credential: Joi.string().trim().required(),
});

const requestOtpSchema = Joi.object({
  phone: Joi.string().trim().required(),
});

// Register-or-login by phone OTP: new users supply name + password, returning ones don't.
const verifyOtpSchema = Joi.object({
  phone: Joi.string().trim().required(),
  code: Joi.string().trim().required(),
  name: Joi.string().trim().min(2).max(100).allow('', null),
  password: Joi.string().min(6).max(128).allow('', null),
});

const requestEmailOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const verifyEmailOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  code: Joi.string().trim().required(),
  name: Joi.string().trim().min(2).max(100).allow('', null),
  password: Joi.string().min(6).max(128).allow('', null),
});

// Either email (token flow) or phone (Telegram OTP flow) must be present.
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase(),
  phone: Joi.string().trim(),
}).or('email', 'phone');

// Token flow: token + password. Phone flow: phone + code + password.
const resetPasswordSchema = Joi.object({
  token: Joi.string().trim(),
  phone: Joi.string().trim(),
  code: Joi.string().trim(),
  password: Joi.string().min(6).max(128).required(),
}).or('token', 'phone');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().email().lowercase().allow('', null),
  phone: Joi.string().trim().max(20).allow(''),
  avatar: Joi.string().uri().allow(''),
  telegram: Joi.string().trim().max(50).allow(''),
  instagram: Joi.string().trim().max(50).allow(''),
});

const addressSchema = Joi.object({
  label: Joi.string().trim().default('Home'),
  street: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
  zipCode: Joi.string().trim().required(),
  isDefault: Joi.boolean().default(false),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

const registerAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

const registerSuperAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  setupKey: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleSchema,
  requestOtpSchema,
  verifyOtpSchema,
  requestEmailOtpSchema,
  verifyEmailOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  addressSchema,
  changePasswordSchema,
  registerAdminSchema,
  registerSuperAdminSchema,
};
