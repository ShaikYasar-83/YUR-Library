const Note = require("../models/Note");
const path = require("path");
const mongoose = require("mongoose");
const { Readable } = require("stream");

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Upload a new note with a file
// @route   POST /api/notes/upload
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const uploadNote = async (req, res) => {
  try {
    // Step 1: Check if multer actually received a file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file (PDF, JPG, or PNG)",
      });
    }

    // Step 2: Extract text fields from request body
    const { title, subject, college, description, semester } = req.body;

    if (!title || !subject || !college) {
      return res.status(400).json({
        success: false,
        message: "Title, subject, and college are required",
      });
    }

    // Step 3: Stream file to MongoDB GridFS
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "notesFiles"
    });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    const readable = Readable.from(req.file.buffer);
    readable.pipe(uploadStream);

    await new Promise((resolve, reject) => {
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
    });

    // Step 4: Determine file type from mimetype
    const mimeToType = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
    };
    const fileType = mimeToType[req.file.mimetype] || "unknown";

    // Step 5: Save note to MongoDB
    const note = new Note({
      title,
      subject,
      college,
      description,
      semester: semester ? Number(semester) : undefined,
      fileName: req.file.originalname,
      fileType,
      uploadedBy: req.user._id, // ← from JWT protect middleware
      status: "pending",        // default — needs admin approval
      gridFsFileId: uploadStream.id,
    });

    note.fileUrl = `${req.protocol}://${req.get("host")}/api/notes/view/${note._id}`;
    await note.save();

    res.status(201).json({
      success: true,
      message: "Note uploaded successfully. It will be reviewed before going live.",
      data: note,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all APPROVED notes with filtering and sorting
// @route   GET /api/notes?subject=AI&college=JNTU&sort=popular
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const getAllNotes = async (req, res) => {
  try {
    // Step 1: Always start with only approved notes
    const query = { status: "approved" };

    // Step 2: Apply optional filters from query string
    // Example: GET /api/notes?subject=AI&college=JNTU
    // $regex makes it case-insensitive ("ai" matches "AI", "Ai", etc.)
    if (req.query.subject) {
      query.subject = { $regex: req.query.subject, $options: "i" };
    }
    if (req.query.college) {
      query.college = { $regex: req.query.college, $options: "i" };
    }
    if (req.query.semester) {
      query.semester = Number(req.query.semester);
    }

    // Step 3: Determine sort order
    // ?sort=popular  → most downloaded first
    // ?sort=latest   → newest upload first (default)
    let sortOption = { createdAt: -1 }; // default: latest
    if (req.query.sort === "popular") {
      sortOption = { downloadsCount: -1 }; // most downloaded first
    }

    // Step 4: Execute the query
    const notes = await Note.find(query)
      .populate("uploadedBy", "name email college branch")
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single note by ID
// @route   GET /api/notes/:id
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "uploadedBy",
      "name email college"
    );

    if (!note) {
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    }

    res.status(200).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all notes uploaded by the logged-in user
// @route   GET /api/notes/my-notes
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const getMyNotes = async (req, res) => {
  try {
    const notes = await Note.find({ uploadedBy: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a note (only by the uploader)
// @route   DELETE /api/notes/:id
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    // Only the uploader can delete their own note
    if (note.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this note",
      });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "notesFiles"
    });
    if (note.gridFsFileId) {
      try {
        await bucket.delete(note.gridFsFileId);
      } catch (err) {
        console.error("GridFS file not found for deletion", err);
      }
    }

    await note.deleteOne();

    res.status(200).json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all PENDING notes (for admin review queue)
// @route   GET /api/notes/admin/pending
// @access  Private + Admin only
// ─────────────────────────────────────────────────────────────────────────────

const getAllPendingNotes = async (req, res) => {
  try {
    const notes = await Note.find({ status: "pending" })
      .populate("uploadedBy", "name email college branch")
      .sort({ createdAt: 1 }); // oldest first — review in order

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Approve a note (change status to 'approved')
// @route   PUT /api/notes/approve/:id
// @access  Private + Admin only
// ─────────────────────────────────────────────────────────────────────────────

const approveNote = async (req, res) => {
  try {
    // Step 1: Find the note by ID from the URL params
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    // Step 2: Check if note is already approved — avoid redundant updates
    if (note.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Note is already approved",
      });
    }

    // Step 3: Update the status to 'approved'
    note.status = "approved";
    await note.save();

    res.status(200).json({
      success: true,
      message: "Note approved successfully",
      data: note,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reject a note (change status to 'rejected')
// @route   PUT /api/notes/reject/:id
// @access  Private + Admin only
// ─────────────────────────────────────────────────────────────────────────────

const rejectNote = async (req, res) => {
  try {
    // Step 1: Find the note by ID
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    // Step 2: Check if already rejected
    if (note.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Note is already rejected",
      });
    }

    // Step 3: Update status to 'rejected'
    note.status = "rejected";
    await note.save();

    res.status(200).json({
      success: true,
      message: "Note rejected",
      data: note,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Search notes by title or description
// @route   GET /api/notes/search?q=machine
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const searchNotes = async (req, res) => {
  try {
    const { q } = req.query;

    // Step 1: Make sure the search query is provided
    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide a search term using ?q=yourterm",
      });
    }

    // Step 2: Use MongoDB $text search on the indexed fields (title + description)
    // The text index we added to the Note model makes this fast.
    // $meta: 'textScore' ranks results by how well they match the search term.
    const notes = await Note.find(
      {
        status: "approved",               // only approved notes
        $text: { $search: q },            // full-text search
      },
      {
        score: { $meta: "textScore" },    // compute relevance score
      }
    )
      .populate("uploadedBy", "name email college branch")
      .sort({ score: { $meta: "textScore" } }); // best match first

    res.status(200).json({
      success: true,
      count: notes.length,
      query: q,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Download a note — increments downloadsCount & streams the file
// @route   GET /api/notes/download/:id
// @access  Private (JWT required)
// ─────────────────────────────────────────────────────────────────────────────

const downloadNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    
    const isAdmin = req.user && req.user.role === "admin";
    if (note.status !== "approved" && !isAdmin) return res.status(403).json({ success: false, message: "Not available" });

    await Note.findByIdAndUpdate(req.params.id, { $inc: { downloadsCount: 1 } });

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "notesFiles"
    });
    
    const contentType = {
      "pdf": "application/pdf",
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png"
    }[note.fileType] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${note.fileName}"`);
    bucket.openDownloadStream(note.gridFsFileId).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const viewNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    
    const isAdmin = req.user && req.user.role === "admin";
    if (note.status !== "approved" && !isAdmin) return res.status(403).json({ success: false, message: "Not available" });

    await Note.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "notesFiles"
    });

    const contentType = {
      "pdf": "application/pdf",
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png"
    }[note.fileType] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    
    bucket.openDownloadStream(note.gridFsFileId).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkUploadNotes = async (req, res) => {
  try {
    // Step 1: Check if multer actually received files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one file (PDF, JPG, or PNG)",
      });
    }

    // Step 2: Extract shared metadata from request body
    const { title: baseTitle, subject, college, description, semester } = req.body;

    if (!subject || !college) {
      return res.status(400).json({
        success: false,
        message: "Subject and college are required",
      });
    }

    const mimeToType = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
    };

    // Step 3: Map each file to a Note creation promise
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "notesFiles"
    });

    const notePromises = req.files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });

        const readable = Readable.from(file.buffer);
        readable.pipe(uploadStream);

        uploadStream.on("error", reject);
        uploadStream.on("finish", async () => {
          try {
            const fileType = mimeToType[file.mimetype] || "unknown";
            let noteTitle = baseTitle 
              ? `${baseTitle} (${index + 1})` 
              : path.parse(file.originalname).name;

            const note = new Note({
              title: noteTitle,
              subject,
              college,
              description,
              semester: semester ? Number(semester) : undefined,
              fileName: file.originalname,
              fileType,
              uploadedBy: req.user._id,
              status: "pending",
              gridFsFileId: uploadStream.id,
            });

            note.fileUrl = `${req.protocol}://${req.get("host")}/api/notes/view/${note._id}`;
            await note.save();
            resolve(note);
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    // Step 4: Execute all creations
    const notes = await Promise.all(notePromises);

    res.status(201).json({
      success: true,
      message: `${notes.length} notes uploaded successfully. They will be reviewed before going live.`,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminUpdateNote = async (req, res) => {
  try {
    const { title, subject, college, description, semester, status } = req.body;
    
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    // Update allowed fields
    if (title) note.title = title;
    if (subject) note.subject = subject;
    if (college !== undefined) note.college = college;
    if (description !== undefined) note.description = description;
    if (semester !== undefined) note.semester = semester;
    if (status) note.status = status;

    await note.save();

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: note,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminDeleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "notesFiles"
    });
    if (note.gridFsFileId) {
      try {
        await bucket.delete(note.gridFsFileId);
      } catch (err) {
        console.error("GridFS file not found for deletion", err);
      }
    }

    await note.deleteOne();

    res.status(200).json({ success: true, message: "Note deleted successfully by admin" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
