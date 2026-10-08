/**
 * Role-Based Access Control Middleware
 * @param  {...String} allowedRoles - Roles allowed to access the route ('CITIZEN', 'OFFICER', 'ADMIN')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
