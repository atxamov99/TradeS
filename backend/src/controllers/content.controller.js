const contentService = require('../services/content.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getContent = asyncHandler(async (req, res) => {
  const data = await contentService.getContent(req.query);
  res.status(200).json(new ApiResponse(200, data, 'Content retrieved'));
});

const getPublicContent = asyncHandler(async (req, res) => {
  const content = await contentService.getPublicContent(req.query);
  res.status(200).json(new ApiResponse(200, { content }, 'Content retrieved'));
});

const createContent = asyncHandler(async (req, res) => {
  const content = await contentService.createContent(req.body);
  res.status(201).json(new ApiResponse(201, content, 'Content created'));
});

const updateContentStatus = asyncHandler(async (req, res) => {
  const content = await contentService.updateContentStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, content, 'Content status updated'));
});

const deleteContent = asyncHandler(async (req, res) => {
  const result = await contentService.deleteContent(req.params.id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

module.exports = { getContent, getPublicContent, createContent, updateContentStatus, deleteContent };
