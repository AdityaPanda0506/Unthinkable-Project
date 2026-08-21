const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate client request using stateless JWT
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey12345!@#$');
      
      // Decoded token contains: { userId, role, email }
      req.user = decoded;
      return next();
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({
        success: false,
        message: "Session expired or token invalid",
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Authentication token required",
  });
};

/**
 * Middleware to restrict access based on user role
 * @param {Array<string>} allowedRoles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: "Forbidden: Insufficient permissions for this action",
    });
  };
};

module.exports = {
  authenticateJWT,
  requireRole,
};
