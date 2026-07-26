const orderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, { order }, 'Order created successfully'));
});

const getMyOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getUserOrders(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Orders retrieved'));
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.user.id,
    req.user.role
  );
  res.status(200).json(new ApiResponse(200, { order }, 'Order retrieved'));
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, { order }, 'Order cancelled'));
});

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder };
