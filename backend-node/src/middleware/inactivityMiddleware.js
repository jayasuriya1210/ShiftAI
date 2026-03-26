const maxIdleMinutes = Number(process.env.MAX_IDLE_MINUTES || 30);

const inactivityMiddleware = (req, res, next) => {
  const lastActivity = Number(req.headers["x-last-activity"]);

  if (Number.isFinite(lastActivity)) {
    const idleMs = Date.now() - lastActivity;
    if (idleMs > maxIdleMinutes * 60 * 1000) {
      return res.status(401).json({ message: "Session expired" });
    }
  }

  return next();
};

module.exports = inactivityMiddleware;
