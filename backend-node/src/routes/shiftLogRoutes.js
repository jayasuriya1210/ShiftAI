const express = require("express");
const router = express.Router();
const multer = require("multer");
const os = require("os");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");
const authOrPublic = require("../middleware/authOrPublic");
const { requireRole } = require("../middleware/roleMiddleware");

const {
  createShiftLog,
  getLogs,
  getLogById,
  updateLog,
  deleteLog,
  transcribeOnly
} = require("../controllers/shiftLogController");

const upload = multer({
  dest: path.join(os.tmpdir(), "shiftlog_uploads")
});

// Create log
router.post("/", authOrPublic, upload.single("file"), createShiftLog);

// Transcribe audio only
router.post("/transcribe", authOrPublic, upload.single("file"), transcribeOnly);

// Get all logs
router.get("/", getLogs);

// Get single log
router.get("/:id", getLogById);

// Update log
router.put("/:id", authMiddleware, updateLog);

// Delete log
router.delete("/:id", authMiddleware, requireRole("admin"), deleteLog);

module.exports = router;
