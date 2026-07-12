const productService = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const isAdmin = (req) => ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.user.id, req.query, { isAdmin: isAdmin(req) });
  res.status(200).json(new ApiResponse(200, result, 'Products retrieved'));
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
  const product = await productService.createProduct(req.body, req.user.id);
  res.status(201).json(new ApiResponse(201, { product }, 'Product created'));
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.user.id, req.body, { isAdmin: isAdmin(req) });
  res.status(200).json(new ApiResponse(200, { product }, 'Product updated'));
});

const restockProduct = asyncHandler(async (req, res) => {
  const product = await productService.restockProduct(req.params.id, req.user.id, req.body.quantity, { isAdmin: isAdmin(req) });
  res.status(200).json(new ApiResponse(200, { product }, 'Product restocked'));
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
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  restockProduct,
  deleteProduct,
  addReview,
  getCategories,
};
