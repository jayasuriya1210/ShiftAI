const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const { unread } = req.query;
    const query = {};
    if (unread === "true") query.read = false;

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAllRead = async (_req, res) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReadStatus = async (req, res) => {
  try {
    const { read } = req.body || {};
    if (typeof read !== "boolean") {
      return res.status(400).json({ message: "read must be boolean" });
    }
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { read },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
