const mongoose = require("mongoose");

const shiftSummarySchema = new mongoose.Schema(
  {
    shiftDate: Date,
    shiftType: String,
    from: Date,
    to: Date,
    shiftLabel: String,
    dateLabel: String,
    generatedAt: Date,
    totals: {
      logs: Number,
      supervisors: Number,
      issues: Number,
      actions: Number,
      pending: Number,
      critical: Number
    },
    sections: {
      issues: [String],
      actions: [String],
      pending: [String],
      criticalAlerts: [
        {
          title: String,
          details: String
        }
      ]
    },
    handoverMessage: String
  },
  { timestamps: true }
);

shiftSummarySchema.index({ shiftDate: 1, shiftType: 1, createdAt: -1 });

module.exports = mongoose.model("ShiftSummary", shiftSummarySchema);
