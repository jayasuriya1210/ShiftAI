const authMiddleware = require("./authMiddleware");

const authOrPublic = (req, res, next) => {
  if (
    process.env.ALLOW_PUBLIC_LOGS === "true" ||
    process.env.ALLOW_PUBLIC_NOTIFICATIONS === "true"
  ) {
    return next();
  }
  return authMiddleware(req, res, next);
};

module.exports = authOrPublic;
