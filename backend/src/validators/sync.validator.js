const Joi = require('joi');

// Offline sync payloads come straight from a device queue that may have been
// built by an older app build, so unknown keys are stripped rather than
// rejected (the service whitelists again before touching Prisma). What must be
// enforced here are the TYPES: `Number(quantity)` on a non-numeric string
// yields NaN and propagates into stock/profit columns.

const productPayloadSchema = Joi.object({
  name: Joi.string().trim().max(200),
  buyPrice: Joi.number().min(0),
  sellPrice: Joi.number().min(0),
  price: Joi.number().min(0),
  discount: Joi.number().min(0).max(100),
  // Mobile sends stock as either `stock` or `quantity` (normalized server-side).
  stock: Joi.number(),
  quantity: Joi.number(),
  unit: Joi.string().trim().max(32),
  description: Joi.string().max(2000).allow('', null),
  category: Joi.string().max(100).allow('', null),
  brand: Joi.string().max(100).allow('', null),
  tags: Joi.array().items(Joi.string().max(50)),
  bagWeightKg: Joi.number().min(0).allow(null),
  isActive: Joi.boolean(),
  // Read by update/delete as the server-side product id.
  serverId: Joi.string().max(64),
});

const salePayloadSchema = Joi.object({
  product: Joi.string().max(64).allow(null, ''),
  productName: Joi.string().trim().max(200).required(),
  quantity: Joi.number().positive().required(),
  sellPrice: Joi.number().min(0).required(),
  buyPrice: Joi.number().min(0),
  unit: Joi.string().trim().max(32),
  note: Joi.string().max(1000).allow('', null),
  createdAt: Joi.alternatives().try(Joi.date(), Joi.number()),
});

const syncPushSchema = Joi.object({
  operations: Joi.array()
    .items(
      Joi.object({
        operation: Joi.string().valid('create', 'update', 'delete').required(),
        entity: Joi.string().valid('product', 'sale').required(),
        // Client-generated id — also the idempotency key persisted as syncId.
        entityId: Joi.string().max(64).required(),
        clientUpdatedAt: Joi.number().integer().min(0),
        payload: Joi.when('entity', {
          is: 'sale',
          then: salePayloadSchema.required(),
          otherwise: productPayloadSchema.default({}),
        }),
      })
    )
    .max(1000)
    .required(),
});

module.exports = { syncPushSchema };
