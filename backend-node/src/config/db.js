const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (process.env.SKIP_DB === "true") {
      console.log("MongoDB connection skipped");
      return;
    }
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/shiftlog";
    await mongoose.connect(mongoUri);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Database connection error:", error.message);
    if (process.env.ALLOW_DB_FAIL === "true") {
      console.log("Continuing without MongoDB");
      return;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
