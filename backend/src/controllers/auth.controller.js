const authService = require("../services/auth.service");

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new Citizen account
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "A valid email address is required." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    const { user, token } = await authService.registerCitizen({ name, email, password });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login existing user (Citizen, Officer, Admin)
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const { user, token } = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (Authenticated)
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  getMe,
};
