const Joi = require('joi');

const createExpenseSchema = Joi.object({
  amount: Joi.number().positive().max(1e12).required(),
  category: Joi.string().trim().max(40).default('other'),
  note: Joi.string().trim().max(500).allow('').default(''),
});

module.exports = { createExpenseSchema };
