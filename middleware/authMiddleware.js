const jwt = require('jsonwebtoken');
const User = require('../models/User');

/* =========================
   AUTH PROTECT MIDDLEWARE
========================= */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    console.log("🔐 PROTECT CHECK:");
    console.log("  - Has token:", !!token);
    console.log("  - Token preview:", token?.substring(0, 30) + "...");

    if (!token) {
      console.log("  ❌ NO TOKEN");
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("  ✅ Token valid, decoded id:", decoded.id);
    } catch (err) {
      console.log("  ❌ Token verify FAILED:", err.message);
      return res.status(401).json({
        success: false,
        message: 'Token expired or invalid'
      });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log("  ❌ USER NOT FOUND in DB for id:", decoded.id);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log("  ✅ User found:", user.email);

    req.user = user;
    next();

  } catch (error) {
    console.log("  ❌ ERROR:", error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/* =========================
   ROLE BASED ACCESS CONTROL
========================= */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this action'
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};