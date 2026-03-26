const express = require("express");
const router = express.Router();
const multer = require("multer");
const os = require("os");
const path = require("path");

const { transcribe, health } = require("../controllers/sttController");

const upload = multer({ dest: path.join(os.tmpdir(), "shiftlog_uploads") });

router.get("/health", health);
router.post("/transcribe", upload.single("file"), transcribe);

module.exports = router;
