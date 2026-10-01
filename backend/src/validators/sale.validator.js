const Joi = require('joi');

const createSaleSchema = Joi.object({
  // Which shop's till this sale was rung up on; ownership verified server-side.
  shopId: Joi.string().trim().max(64).required(),
  product: Joi.string(),
  productName: Joi.string().trim().required(),
  quantity: Joi.number().positive().required(),
  sellPrice: Joi.number().min(0).required(),
  buyPrice: Joi.number().min(0).required(),
  unit: Joi.string().trim().default('pcs'),
  note: Joi.string().trim().allow('').default(''),
  syncId: Joi.string().trim().allow('').optional(),
  isFromOffline: Joi.boolean().default(false),
  createdAt: Joi.date().iso().optional(), // allow offline timestamp
});

const bulkSyncSchema = Joi.object({
  sales: Joi.array().items(createSaleSchema).min(1).required(),
});

module.exports = { createSaleSchema, bulkSyncSchema };
