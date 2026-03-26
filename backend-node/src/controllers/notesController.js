const ShiftNote = require("../models/ShiftNote");

exports.createNote = async (req, res) => {
  try {
    const { transcript, title, summary, source, fileName, durationSec } = req.body || {};
    if (!transcript) {
      return res.status(400).json({ message: "transcript is required" });
    }
    const note = await ShiftNote.create({
      transcript,
      title,
      summary,
      source,
      fileName,
      durationSec: Number.isFinite(Number(durationSec)) ? Number(durationSec) : null
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 100);
    const search = req.query.search ? String(req.query.search).trim() : "";
    const query = {};

    if (search) {
      const pattern = new RegExp(search, "i");
      query.$or = [
        { title: pattern },
        { transcript: pattern },
        { fileName: pattern }
      ];
    }

    const notes = await ShiftNote.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
