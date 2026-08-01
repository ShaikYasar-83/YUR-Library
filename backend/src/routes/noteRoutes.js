const express = require("express");
const router = express.Router();

const {
  uploadNote,
  bulkUploadNotes,
  getAllNotes,
  getNoteById,
  getMyNotes,
  deleteNote,
  getAllPendingNotes,
  approveNote,
  rejectNote,
  searchNotes,
  downloadNote,
  viewNote,
  adminUpdateNote,
  adminDeleteNote,
} = require("../controllers/noteController");

const { protect, getOptionalUser } = require("../middlewares/protect");
const isAdmin = require("../middlewares/isAdmin");
const upload = require("../config/upload");

// ─── User Routes (JWT required) ───────────────────────────────────────────────

// GET /api/notes              → Get all approved notes (supports filter + sort)
// ?subject=AI&college=JNTU   → filter by subject and/or college
// ?sort=popular              → sort by most downloaded
// ?sort=latest               → sort by newest (default)
router.get("/", getAllNotes);

// GET /api/notes/search?q=machine  → Full-text search on title + description
router.get("/search", searchNotes);

// GET /api/notes/user/my-notes → Notes uploaded by the logged-in user
router.get("/user/my-notes", protect, getMyNotes);

// GET /api/notes/download/:id  → Download file + increment downloadsCount
router.get("/download/:id", getOptionalUser, downloadNote);

// GET /api/notes/view/:id      → View file inline + increment viewsCount
router.get("/view/:id", getOptionalUser, viewNote);

// GET /api/notes/:id          → Get a single note by ID
router.get("/:id", getNoteById);

// POST /api/notes/upload      → Upload a new note with file
// Flow: protect → upload.single → uploadNote
router.post(
  "/upload",
  protect,
  upload.single("noteFile"),
  (err, req, res, next) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  },
  uploadNote
);

// DELETE /api/notes/:id       → Delete a note (owner only)
router.delete("/:id", protect, deleteNote);

// ─── Admin Routes (JWT + Admin role required) ─────────────────────────────────
// protect  → checks the JWT token (is user logged in?)
// isAdmin  → checks the role (is user an admin?)

// GET /api/notes/admin/pending   → View all pending notes
router.get("/admin/pending", protect, isAdmin, getAllPendingNotes);

// PUT /api/notes/approve/:id     → Approve a note
router.put("/approve/:id", protect, isAdmin, approveNote);

// PUT /api/notes/reject/:id      → Reject a note
router.put("/reject/:id", protect, isAdmin, rejectNote);

// POST /api/notes/admin/bulk-upload → Bulk upload notes (admin only)
router.post(
  "/admin/bulk-upload",
  protect,
  isAdmin,
  upload.array("noteFiles", 10), // Limit to 10 files
  (err, req, res, next) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  },
  bulkUploadNotes
);

// PUT /api/notes/admin/:id       → Admin edit note details
router.put("/admin/:id", protect, isAdmin, adminUpdateNote);

// DELETE /api/notes/admin/:id    → Admin delete note
router.delete("/admin/:id", protect, isAdmin, adminDeleteNote);

module.exports = router;

