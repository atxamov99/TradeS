const Joi = require('joi');

// Body for POST /cart/add — a product id and how many to add.
const addToCartSchema = Joi.object({
  productId: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(1).max(1000).default(1),
});

// Body for PATCH /cart/item/:productId — the new absolute quantity.
const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(1000).required(),
});

module.exports = { addToCartSchema, updateCartItemSchema };
