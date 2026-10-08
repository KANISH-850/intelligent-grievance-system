const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");

/**
 * Generate JWT token for a user
 * @param {Object} user - User object containing id and role
 * @returns {String} Signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token string
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
