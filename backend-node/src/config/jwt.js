module.exports = {
  secret: process.env.JWT_SECRET || "dev_secret_change_me",
  expiresIn: "30m"
};
