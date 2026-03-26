const Handover = require("../models/Handover");
const Notification = require("../models/Notification");

exports.sendHandover = async (req, res) => {
  try {
    const { method, toTeam, message, shiftType, shiftDate } = req.body;

    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const handover = new Handover({
      method,
      toTeam,
      message,
      shiftType,
      shiftDate,
      createdBy: req.user?.employeeId || req.user?.id
    });

    await handover.save();

    await Notification.create({
      type: "info",
      title: "Shift handover sent",
      desc: `Method: ${method || "inapp"}${toTeam ? ` · To: ${toTeam}` : ""}`,
      source: "handover"
    });

    res.json({ message: "Handover sent", handover });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
