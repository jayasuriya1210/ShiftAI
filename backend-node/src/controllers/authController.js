const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const sanitizeUser = (user) => ({
  id: user._id,
  employeeId: user.employeeId,
  email: user.email,
  name: user.name,
  role: user.role
});

exports.register = async (req, res) => {
  try {
    const { employeeId, email, name, password, role } = req.body;

    if (!employeeId || !name || !password) {
      return res.status(400).json({
        message: "employeeId, name, and password are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ employeeId }, ...(email ? [{ email }] : [])]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const allowAdmin = process.env.ALLOW_ADMIN_REGISTER === "true";
    const safeRole = role === "admin" && allowAdmin ? "admin" : "employee";

    const user = new User({
      employeeId,
      email,
      name,
      passwordHash,
      role: safeRole
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, employeeId: user.employeeId, role: user.role },
      JWT_SECRET,
      { expiresIn: "30m" }
    );

    res.json({
      message: "User registered successfully",
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { employeeId, email, password } = req.body;

    if ((!employeeId && !email) || !password) {
      return res.status(400).json({
        message: "employeeId or email and password are required"
      });
    }

    const user = await User.findOne(
      email ? { email } : { employeeId }
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id, employeeId: user.employeeId, role: user.role },
      JWT_SECRET,
      { expiresIn: "30m" }
    );

    res.json({
      message: "Login successful",
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
