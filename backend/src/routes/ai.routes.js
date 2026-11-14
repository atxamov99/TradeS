const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const auth = require("../middlewares/auth.middleware");
const { aiLimiter } = require("../middlewares/rateLimiter.middleware");

router.post("/ask", auth.protect, aiLimiter, aiController.askAI);

module.exports = router;
