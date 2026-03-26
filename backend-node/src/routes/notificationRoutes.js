const express = require("express");
const router = express.Router();
const authOrPublic = require("../middleware/authOrPublic");

const {
  getNotifications,
  markAllRead,
  updateReadStatus
} = require("../controllers/notificationController");

router.get("/", authOrPublic, getNotifications);
router.post("/mark-all-read", authOrPublic, markAllRead);
router.patch("/:id/read", authOrPublic, updateReadStatus);

module.exports = router;
