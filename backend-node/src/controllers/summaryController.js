const ShiftLog = require("../models/ShiftLog");
const ShiftSummary = require("../models/ShiftSummary");
const { generateShiftSummary } = require("../services/summarizationService");
const Notification = require("../models/Notification");

const toDateRange = (dateString) => {
  const start = new Date(dateString);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateString);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const shiftLabelFromType = (shiftType) => {
  switch (shiftType) {
    case "ShiftA":
      return "Shift A";
    case "ShiftB":
      return "Shift B";
    case "ShiftC":
      return "Shift C";
    default:
      return shiftType || "Shift";
  }
};

const formatDateLabel = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

const buildQuery = ({ shiftDate, shiftType, from, to }) => {
  const query = {};
  if (shiftType) query.shiftType = shiftType;
  if (shiftDate) {
    const range = toDateRange(shiftDate);
    query.shiftDate = { $gte: range.start, $lte: range.end };
  } else if (from || to) {
    query.shiftDate = {};
    if (from) query.shiftDate.$gte = new Date(from);
    if (to) query.shiftDate.$lte = new Date(to);
  }
  return query;
};

exports.generateSummary = async (req, res) => {
  try {
    const { shiftDate, shiftType, from, to } = req.body;
    const query = buildQuery({ shiftDate, shiftType, from, to });
    const logs = await ShiftLog.find(query).sort({ createdAt: -1 });

    const summary = generateShiftSummary(logs, {
      shiftLabel: shiftLabelFromType(shiftType),
      dateLabel: formatDateLabel(shiftDate)
    });

    await ShiftSummary.create({
      shiftDate: shiftDate ? new Date(shiftDate) : undefined,
      shiftType: shiftType || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      shiftLabel: summary.shiftLabel,
      dateLabel: summary.dateLabel,
      generatedAt: summary.generatedAt ? new Date(summary.generatedAt) : new Date(),
      totals: summary.totals,
      sections: summary.sections,
      handoverMessage: summary.handoverMessage
    });

    await Notification.create({
      type: "info",
      title: "AI Summary Available",
      desc: `${summary.shiftLabel || "Shift"} summary generated`,
      source: "summary"
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSummaryPreview = async (req, res) => {
  try {
    const { shiftDate, shiftType, from, to } = req.query;
    const query = buildQuery({ shiftDate, shiftType, from, to });
    const logs = await ShiftLog.find(query).sort({ createdAt: -1 });

    const summary = generateShiftSummary(logs, {
      shiftLabel: shiftLabelFromType(shiftType),
      dateLabel: formatDateLabel(shiftDate)
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
