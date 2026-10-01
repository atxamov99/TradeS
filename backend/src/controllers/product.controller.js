const productService = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const isAdmin = (req) => ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

const browseProducts = asyncHandler(async (req, res) => {
  const result = await productService.browseProducts(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Products retrieved'));
});

const getShopProducts = asyncHandler(async (req, res) => {
  const result = await productService.getShopProducts(req.params.id, req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Shop products retrieved'));
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json(new ApiResponse(200, { product }, 'Product retrieved'));
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, { product }, 'Product retrieved'));
});

const createProduct = asyncHandler(async (req, res) => {
  const { shopId, ...productData } = req.body;
  const product = await productService.createProduct(shopId, req.user.id, productData);
  res.status(201).json(new ApiResponse(201, { product }, 'Product created'));
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.user.id, req.body, { isAdmin: isAdmin(req) });
  res.status(200).json(new ApiResponse(200, { product }, 'Product updated'));
});

const restockProduct = asyncHandler(async (req, res) => {
  const { batch, ...product } = await productService.restockProduct(
    req.params.id,
    req.user.id,
    req.body,
    { isAdmin: isAdmin(req) }
  );
  res.status(200).json(new ApiResponse(200, { product, batch }, 'Product restocked'));
});

const getShopInventory = asyncHandler(async (req, res) => {
  const result = await productService.getShopInventoryBatches(req.params.id, req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Shop inventory batches retrieved'));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id, req.user.id, { isAdmin: isAdmin(req) });
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const addReview = asyncHandler(async (req, res) => {
  const product = await productService.addReview(
    req.params.id,
    req.user.id,
    req.user.name,
    req.body
  );
  res.status(201).json(new ApiResponse(201, { product }, 'Review added'));
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await productService.getCategories();
  res.status(200).json(new ApiResponse(200, { categories }, 'Categories retrieved'));
});

module.exports = {
  browseProducts,
  getShopProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  restockProduct,
  getShopInventory,
  deleteProduct,
  addReview,
  getCategories,
};
