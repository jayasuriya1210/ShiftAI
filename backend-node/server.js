const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const shiftLogRoutes = require("./src/routes/shiftLogRoutes");
const summaryRoutes = require("./src/routes/summaryRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const handoverRoutes = require("./src/routes/handoverRoutes");
const sttRoutes = require("./src/routes/sttRoutes");
const notesRoutes = require("./src/routes/notesRoutes");
const issueRoutes = require("./src/routes/issueRoutes");

dotenv.config({ override: true });

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

connectDB();

app.get("/", (req, res) => {
  res.send("ShiftLog API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/shiftlogs", shiftLogRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/handover", handoverRoutes);
app.use("/api/stt", sttRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/issues", issueRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
