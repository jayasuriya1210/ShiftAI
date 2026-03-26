const mongoose = require("mongoose");

const handoverSchema = new mongoose.Schema(
  {
    shiftType: String,
    shiftDate: Date,
    method: {
      type: String,
      enum: ["email", "whatsapp", "inapp"],
      default: "inapp"
    },
    toTeam: String,
    message: String,
    createdBy: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Handover", handoverSchema);
