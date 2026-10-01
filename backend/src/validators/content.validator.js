const Joi = require('joi');

const createContentSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  type: Joi.string().trim().valid('landing_page', 'knowledge_base', 'media_asset').default('landing_page'),
  status: Joi.string().trim().valid('draft', 'published', 'archived').default('draft'),
  owner: Joi.string().trim().allow('').default(''),
  body: Joi.string().allow('').default(''),
});

const updateContentStatusSchema = Joi.object({
  status: Joi.string().trim().valid('draft', 'published', 'archived').required(),
});

module.exports = { createContentSchema, updateContentStatusSchema };
