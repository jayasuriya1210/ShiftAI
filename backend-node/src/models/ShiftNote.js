const mongoose = require("mongoose");

const shiftNoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true
    },
    transcript: {
      type: String,
      required: true,
      trim: true
    },
    summary: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      enum: ["recorded", "uploaded"],
      default: "recorded"
    },
    fileName: {
      type: String,
      trim: true
    },
    durationSec: Number,
    legacyId: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

shiftNoteSchema.index({ createdAt: -1 });
shiftNoteSchema.index({ legacyId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("ShiftNote", shiftNoteSchema);
