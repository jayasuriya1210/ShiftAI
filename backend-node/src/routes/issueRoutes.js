const express = require("express");
const router = express.Router();
const authOrPublic = require("../middleware/authOrPublic");

const {
  getIssues,
  updateIssueStatus
} = require("../controllers/shiftLogController");

router.get("/", getIssues);
router.patch("/:id/status", authOrPublic, updateIssueStatus);

module.exports = router;
