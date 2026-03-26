const mongoose = require("mongoose");

const shiftLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true
    },

    employeeName: {
      type: String
    },

    employeeRole: {
      type: String,
      enum: ["Supervisor", "Lead Technician", "Technician", "Operator"]
    },

    shiftDate: {
      type: Date,
      required: true
    },

    shiftType: {
      type: String,
      enum: ["Morning", "Evening", "Night", "ShiftA", "ShiftB", "ShiftC"]
    },

    rawTranscription: String,

    structuredLog: {
      issue: String,
      actionTaken: String,
      pendingTasks: [String],
      department: String,
      priority: {
        type: String,
        enum: ["critical", "high", "medium", "low"]
      },
      status: {
        type: String,
        enum: ["pending", "resolved"],
        default: "pending"
      },
      details: String,
      productionDetails: String,
      maintenanceDetails: String,
      additionalDetails: String
    },

    summary: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShiftLog", shiftLogSchema);
