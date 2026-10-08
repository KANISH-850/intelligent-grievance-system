const { verifyToken } = require("../utils/jwt");
const { prisma } = require("../config/database");

/**
 * Authentication Middleware
 * Protects routes by validating Bearer JWT tokens in the Authorization header.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Missing token.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Malformed token.",
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department_id: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account associated with token no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
};
