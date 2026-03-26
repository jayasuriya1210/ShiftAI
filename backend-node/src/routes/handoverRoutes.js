const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { sendHandover } = require("../controllers/handoverController");

router.post("/send", authMiddleware, sendHandover);

module.exports = router;
