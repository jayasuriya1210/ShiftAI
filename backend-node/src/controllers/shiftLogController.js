const ShiftLog = require("../models/ShiftLog");
const Notification = require("../models/Notification");
const { transcribeAudio } = require("../services/sttService");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");

const writeTempAudio = async (base64, filenameHint = "audio.wav") => {
  const cleaned = base64.includes(",") ? base64.split(",").pop() : base64;
  const buffer = Buffer.from(cleaned, "base64");
  const tempName = `stt_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}_${filenameHint}`;
  const tempPath = path.join(os.tmpdir(), tempName);
  await fs.writeFile(tempPath, buffer);
  return tempPath;
};

const parseDateRange = (dateString) => {
  const start = new Date(dateString);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateString);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const parseStructuredLog = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
};

const deriveIssueTitle = (text) => {
  if (!text || typeof text !== "string") return "Shift issue";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Shift issue";
  const sentence = cleaned.split(/[.!?]/)[0];
  const words = sentence.split(" ").slice(0, 10).join(" ");
  return words || "Shift issue";
};

// Create Shift Log
exports.createShiftLog = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      employeeRole,
      shiftDate,
      shiftType,
      rawTranscription,
      structuredLog,
      summary,
      audioBase64,
      issueTitle
    } = req.body;

    if (!employeeId || !shiftDate) {
      return res.status(400).json({
        message: "employeeId and shiftDate are required"
      });
    }

    let transcription = rawTranscription;
    let tempFilePath;

    if (!transcription && audioBase64) {
      tempFilePath = await writeTempAudio(audioBase64);
      transcription = await transcribeAudio(tempFilePath);
    } else if (!transcription && req.file?.path) {
      transcription = await transcribeAudio(req.file.path);
    }

    let finalStructured = parseStructuredLog(structuredLog);

    if (!finalStructured && (issueTitle || transcription)) {
      finalStructured = {
        issue: issueTitle || deriveIssueTitle(transcription),
        details: transcription,
        status: "pending"
      };
    } else if (finalStructured) {
      if (!finalStructured.issue && issueTitle) {
        finalStructured.issue = issueTitle;
      }
      if (!finalStructured.details && transcription) {
        finalStructured.details = transcription;
      }
      if (!finalStructured.status) {
        finalStructured.status = "pending";
      }
    }

    const log = new ShiftLog({
      employeeId,
      employeeName,
      employeeRole,
      shiftDate,
      shiftType,
      rawTranscription: transcription,
      structuredLog: finalStructured || undefined,
      summary: summary || undefined
    });

    await log.save();

    const priority = log.structuredLog?.priority;
    let type = "log";
    if (priority === "critical") type = "critical";
    else if (priority === "high") type = "warning";

    await Notification.create({
      type,
      title: "New shift log added",
      desc: log.structuredLog?.issue || log.rawTranscription?.slice(0, 120),
      source: "shiftlog"
    });

    res.status(201).json({
      message: "Shift log saved successfully",
      log
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => null);
    }
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => null);
    }
  }
};

// Issues list
exports.getIssues = async (req, res) => {
  try {
    const { status, limit = 50, from, to } = req.query;
    const query = {
      "structuredLog.issue": { $exists: true, $ne: "" }
    };

    if (status) {
      query["structuredLog.status"] = status;
    }

    if (from || to) {
      query.shiftDate = {};
      if (from) query.shiftDate.$gte = new Date(from);
      if (to) query.shiftDate.$lte = new Date(to);
    }

    const issues = await ShiftLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200))
      .select({
        employeeName: 1,
        shiftType: 1,
        shiftDate: 1,
        structuredLog: 1,
        createdAt: 1,
        updatedAt: 1
      });

    const payload = issues.map((log) => ({
      id: log._id.toString(),
      issue: log.structuredLog?.issue || "",
      status: log.structuredLog?.status || "pending",
      priority: log.structuredLog?.priority || null,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      employeeName: log.employeeName || "",
      shiftType: log.shiftType || ""
    }));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update issue status
exports.updateIssueStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["pending", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await ShiftLog.findByIdAndUpdate(
      req.params.id,
      { "structuredLog.status": status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json({
      id: updated._id.toString(),
      status: updated.structuredLog?.status || status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all logs
exports.getLogs = async (req, res) => {
  try {
    const {
      search,
      employeeId,
      shiftType,
      status,
      priority,
      department,
      date,
      from,
      to,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    if (employeeId) query.employeeId = employeeId;
    if (shiftType) query.shiftType = shiftType;
    if (status) query["structuredLog.status"] = status;
    if (priority) query["structuredLog.priority"] = priority;
    if (department) query["structuredLog.department"] = department;

    if (date) {
      const range = parseDateRange(date);
      query.shiftDate = { $gte: range.start, $lte: range.end };
    } else if (from || to) {
      query.shiftDate = {};
      if (from) query.shiftDate.$gte = new Date(from);
      if (to) query.shiftDate.$lte = new Date(to);
    }

    if (search) {
      query.$or = [
        { employeeName: new RegExp(search, "i") },
        { rawTranscription: new RegExp(search, "i") },
        { "structuredLog.issue": new RegExp(search, "i") },
        { "structuredLog.actionTaken": new RegExp(search, "i") },
        { "structuredLog.department": new RegExp(search, "i") },
        { "structuredLog.details": new RegExp(search, "i") }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await ShiftLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json(logs);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// Get single log
exports.getLogById = async (req, res) => {
  try {
    const log = await ShiftLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        message: "Shift log not found"
      });
    }

    res.json(log);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// Update log
exports.updateLog = async (req, res) => {
  try {
    const updated = await ShiftLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Shift log not found"
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// Delete log
exports.deleteLog = async (req, res) => {
  try {
    const deleted = await ShiftLog.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Shift log not found"
      });
    }

    res.json({ message: "Shift log deleted" });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// Transcribe only
exports.transcribeOnly = async (req, res) => {
  try {
    let transcription;
    let tempFilePath;

    if (req.body?.audioBase64) {
      tempFilePath = await writeTempAudio(req.body.audioBase64);
      transcription = await transcribeAudio(tempFilePath);
    } else if (req.file?.path) {
      transcription = await transcribeAudio(req.file.path);
    } else {
      return res.status(400).json({
        message: "audioBase64 or file is required"
      });
    }

    res.json({
      transcription
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => null);
    }
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => null);
    }
  }
};
