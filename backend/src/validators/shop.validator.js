const Joi = require('joi');

const createShopSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
});

const addMemberSchema = Joi.object({
  // identify the user to add either by id or by phone/email lookup
  userId: Joi.string().trim(),
  phone: Joi.string().trim(),
  email: Joi.string().trim().lowercase(),
  role: Joi.string().valid('OWNER', 'CASHIER').default('CASHIER'),
})
  .xor('userId', 'phone', 'email')
  .messages({ 'object.xor': 'Provide exactly one of userId, phone or email' });

module.exports = { createShopSchema, addMemberSchema };
