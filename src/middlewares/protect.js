const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─────────────────────────────────────────────────────────────────────────────
// protect middleware — Guards private routes
//
// How it works:
//   1. Reads the "Authorization" header from the request
//   2. Extracts the token (format: "Bearer <token>")
//   3. Verifies the token using JWT_SECRET
//   4. Finds the user from DB using the ID stored in the token
//   5. Attaches user to req.user so the next route handler can use it
//
// Usage: add `protect` as the second argument on any private route
//   router.get("/me", protect, getMe);
// ─────────────────────────────────────────────────────────────────────────────

const protect = async (req, res, next) => {
  let token;

  // Step 1: Check if Authorization header exists or if token is in query string
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // "Bearer eyJhbGci..." → split on space → take index [1]
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  // Step 2: If no token found, reject the request
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided. Please log in.",
    });
  }

  try {
    // Step 3: Verify the token — this decodes it and checks the signature
    // If token is expired or tampered with, jwt.verify() will throw an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: "64abc...", iat: 1710000000, exp: 1710604800 }

    // Step 4: Find the user in the database using the id from the token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists",
      });
    }

    // Step 5: Attach user to request — now available as req.user in controllers
    req.user = user;

    // Step 6: Call next() to pass control to the actual route handler
    next();
  } catch (error) {
    // Handles: TokenExpiredError, JsonWebTokenError, etc.
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

module.exports = protect;
