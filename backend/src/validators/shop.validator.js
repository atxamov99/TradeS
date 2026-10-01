const Joi = require('joi');

const createShopSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(2000).allow('').default(''),
});

const updateShopSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().max(2000).allow(''),
}).min(1);

const blockShopSchema = Joi.object({
  reason: Joi.string().trim().max(500).allow('').default(''),
});

module.exports = { createShopSchema, updateShopSchema, blockShopSchema };
