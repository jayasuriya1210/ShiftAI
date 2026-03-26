const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["critical", "warning", "info", "log", "success"],
      default: "info"
    },
    title: {
      type: String,
      required: true
    },
    desc: {
      type: String
    },
    read: {
      type: Boolean,
      default: false
    },
    source: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
