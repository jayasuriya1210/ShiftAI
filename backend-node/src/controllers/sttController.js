const { transcribeAudio } = require("../services/sttService");
const fs = require("fs/promises");

exports.transcribe = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: "Audio file is required" });
    }
    const transcription = await transcribeAudio(req.file.path);
    res.json({ transcription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => null);
    }
  }
};

exports.health = async (_req, res) => {
  res.json({ status: "ok" });
};
