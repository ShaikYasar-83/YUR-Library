const Request = require("../models/Request");

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new note request
// @route   POST /api/requests
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const createRequest = async (req, res) => {
  try {
    const { requestText, subject } = req.body;

    // Step 1: Validate required field
    if (!requestText) {
      return res.status(400).json({
        success: false,
        message: "requestText is required",
      });
    }

    // Step 2: Create the request
    // Auto-fill college from the logged-in user's profile (req.user set by protect)
    const request = await Request.create({
      user: req.user._id,
      requestText,
      subject: subject || null,
      college: req.user.college, // pulled from JWT protect middleware
    });

    // Step 3: Populate user info for a richer response
    await request.populate("user", "name email college branch");

    res.status(201).json({
      success: true,
      message: "Request submitted successfully",
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all requests by the currently logged-in user
// @route   GET /api/requests/my
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const getMyRequests = async (req, res) => {
  try {
    // Find only requests made by this user, newest first
    const requests = await Request.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get ALL requests (Admin only)
// @route   GET /api/requests
// @access  Private + Admin only
// ─────────────────────────────────────────────────────────────────────────────

const getAllRequests = async (req, res) => {
  try {
    // Step 1: Build query — admin can filter by status
    // Example: GET /api/requests?status=pending
    const query = {};
    if (req.query.status) {
      query.status = req.query.status; // "pending" or "completed"
    }

    // Step 2: Fetch all requests with the requesting user's info
    const requests = await Request.find(query)
      .populate("user", "name email college branch year")
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark a request as completed (Admin only)
// @route   PUT /api/requests/:id
// @access  Private + Admin only
// ─────────────────────────────────────────────────────────────────────────────

const markCompleted = async (req, res) => {
  try {
    // Step 1: Find the request by ID from the URL
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Step 2: Check if already completed — avoid redundant updates
    if (request.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This request is already marked as completed",
      });
    }

    // Step 3: Update status and optionally store an admin note
    // Admin can send: { "adminNote": "Notes uploaded! Check /api/notes?subject=IoT" }
    request.status = "completed";
    request.adminNote = req.body.adminNote || null;
    await request.save();

    res.status(200).json({
      success: true,
      message: "Request marked as completed",
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a request (only by the original requester)
// @route   DELETE /api/requests/:id
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Only the user who made the request can delete it
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own requests",
      });
    }

    await request.deleteOne();

    res.status(200).json({ success: true, message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  markCompleted,
  deleteRequest,
};
