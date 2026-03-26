// backend-node/src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET || "dev_secret_change_me";

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired" });
  }
};

module.exports = authMiddleware;
