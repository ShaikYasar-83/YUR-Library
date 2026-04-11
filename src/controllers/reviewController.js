const Review = require("../models/Review");
const Note = require("../models/Note");

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add a review (rating + comment) for a note
// @route   POST /api/reviews
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const addReview = async (req, res) => {
  try {
    const { noteId, rating, comment } = req.body;

    // Step 1: Validate required fields
    if (!noteId || !rating) {
      return res.status(400).json({
        success: false,
        message: "noteId and rating are required",
      });
    }

    // Step 2: Make sure the note actually exists and is approved
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    if (note.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "You can only review approved notes",
      });
    }

    // Step 3: Prevent the uploader from reviewing their own note
    if (note.uploadedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot review your own note",
      });
    }

    // Step 4: Try to create the review
    // If the user already reviewed this note, MongoDB will throw a
    // duplicate key error (because of the unique index on note+user)
    const review = await Review.create({
      note: noteId,
      user: req.user._id,  // from JWT protect middleware
      rating,
      comment,
    });

    // Step 5: Populate user info for a richer response
    // (calcAverageRating is called automatically via the post-save hook)
    await review.populate("user", "name email");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    // MongoDB duplicate key error code = 11000
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this note. Each user can only review once.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all reviews for a specific note
// @route   GET /api/reviews/:noteId
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const getReviewsByNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    // Step 1: Check the note exists
    const note = await Note.findById(noteId).select(
      "title subject averageRating totalReviews"
    );
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    // Step 2: Fetch all reviews for this note, newest first
    const reviews = await Review.find({ note: noteId })
      .populate("user", "name college branch") // show reviewer's name & college
      .sort({ createdAt: -1 });

    // Step 3: Return reviews along with the note's rating summary
    res.status(200).json({
      success: true,
      note: {
        id: note._id,
        title: note.title,
        subject: note.subject,
        averageRating: note.averageRating,  // e.g. 4.2
        totalReviews: note.totalReviews,    // e.g. 15
      },
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a review (only by the reviewer)
// @route   DELETE /api/reviews/:reviewId
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Only the reviewer can delete their own review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    const noteId = review.note; // save before deleting

    await review.deleteOne();

    // Manually recalculate average because the post-save hook
    // only triggers on save, not on delete
    await Review.calcAverageRating(noteId);

    res.status(200).json({
      success: true,
      message: "Review deleted and ratings recalculated",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addReview, getReviewsByNote, deleteReview };
