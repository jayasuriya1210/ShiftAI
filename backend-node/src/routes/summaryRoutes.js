const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  generateSummary,
  getSummaryPreview
} = require("../controllers/summaryController");

router.post("/generate", authMiddleware, generateSummary);
router.get("/preview", getSummaryPreview);

module.exports = router;
