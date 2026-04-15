const express = require("express");
const router = express.Router();

const { addReview, getReviewsByNote, deleteReview } = require("../controllers/reviewController");
const { protect, getOptionalUser } = require("../middlewares/protect");

// POST /api/reviews            → Submit a new review (rating + comment)
// Body: { noteId, rating, comment }
router.post("/", getOptionalUser, addReview);

// GET /api/reviews/:noteId     → Get all reviews for a specific note
router.get("/:noteId", getOptionalUser, getReviewsByNote);

// DELETE /api/reviews/:reviewId → Delete your own review (Still requires login)
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;
