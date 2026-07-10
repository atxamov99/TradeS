const Joi = require('joi');

const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string().required(),
        quantity: Joi.number().integer().min(1).max(10000).required(),
      })
    )
    .min(1)
    .max(50)
    .required(),
  shippingAddress: Joi.object({
    street: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    zipCode: Joi.string().trim().required(),
  }).required(),
  paymentMethod: Joi.string()
    .valid('card', 'cash_on_delivery', 'paypal')
    .default('cash_on_delivery'),
  notes: Joi.string().trim().max(500).allow('').default(''),
  // Merchant POS flow (mobile): also record a Sale per item under the buyer's
  // account so their Dashboard/Reports reflect this in-store sale.
  posSale: Joi.boolean().default(false),
});

const updateOrderStatusSchema = Joi.object({
  orderStatus: Joi.string()
    .valid('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
    .required(),
  paymentStatus: Joi.string().valid('pending', 'paid', 'failed', 'refunded'),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };
