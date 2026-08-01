const Stat = require("../models/Stat");
const User = require("../models/User");
const Note = require("../models/Note");

// @desc    Increment global website visits
// @route   POST /api/stats/visit
// @access  Public
const recordVisit = async (req, res) => {
  try {
    const stat = await Stat.findOneAndUpdate(
      { type: "global" },
      { $inc: { visitsCount: 1 } },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, visitsCount: stat.visitsCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get stats for admin dashboard
// @route   GET /api/stats/admin
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments({});
    
    let stat = await Stat.findOne({ type: "global" });
    if (!stat) stat = await Stat.create({ type: "global", visitsCount: 0 });

    const totalPdfs = await Note.countDocuments({ fileType: "pdf" });
    
    const downloadsResult = await Note.aggregate([
      { $group: { _id: null, totalDownloads: { $sum: "$downloadsCount" } } }
    ]);
    const totalDownloads = downloadsResult.length > 0 ? downloadsResult[0].totalDownloads : 0;

    res.status(200).json({
      success: true,
      data: {
        happyUsersAlive: usersCount,
        globalExplorations: stat.visitsCount,
        totalPdfs,
        totalDownloads
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  recordVisit,
  getAdminStats
};
