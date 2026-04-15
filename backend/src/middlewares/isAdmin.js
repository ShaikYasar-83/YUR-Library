// isAdmin.js — Admin-only access middleware
//
// How it works:
//   This middleware runs AFTER the `protect` middleware.
//   protect → sets req.user (logged-in user data)
//   isAdmin → checks if req.user.role === 'admin'
//
// Usage in routes:
//   router.put("/approve/:id", protect, isAdmin, approveNote);
//                               ↑           ↑
//                         checks JWT    checks role

const isAdmin = (req, res, next) => {
  // req.user was attached by the protect middleware
  if (req.user && req.user.role === "admin") {
    // ✅ User is admin — allow them to continue
    next();
  } else {
    // ❌ User is logged in but NOT an admin
    res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
    // 403 Forbidden = "you're logged in but not allowed here"
    // (different from 401 = "you're not even logged in")
  }
};

module.exports = isAdmin;
