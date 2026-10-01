const orderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const createOrder = asyncHandler(async (req, res) => {
  // A multi-shop cart yields one order per shop, so the response is always a list.
  // `skipped` lists cart items that were no longer available and were left out.
  const { orders, skipped } = await orderService.createOrder(req.user.id, req.body);
  const message = skipped.length
    ? `${orders.length} ta buyurtma yaratildi, ${skipped.length} ta mahsulot mavjud emas edi`
    : 'Order created successfully';
  res.status(201).json(new ApiResponse(201, { orders, skipped }, message));
});

const getMyOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getUserOrders(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Orders retrieved'));
});

const getShopOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getShopOrders(req.params.id, req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Shop orders retrieved'));
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

// Admin only
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { order }, 'Order status updated'));
});

// Shop owner updating an order placed with their own shop
const updateShopOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateShopOrderStatus(
    req.params.id,
    req.params.orderId,
    req.user.id,
    req.body
  );
  res.status(200).json(new ApiResponse(200, { order }, 'Order status updated'));
});

module.exports = {
  createOrder,
  getMyOrders,
  getShopOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  updateShopOrderStatus,
};
