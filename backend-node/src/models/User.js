const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      unique: true,
      sparse: true
    },
    name: {
      type: String,
      required: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
