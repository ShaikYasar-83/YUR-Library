const express = require("express");
const { recordVisit, getAdminStats } = require("../controllers/statController");
const { protect } = require("../middlewares/protect");
const admin = require("../middlewares/isAdmin");

const router = express.Router();

router.post("/visit", recordVisit);
router.get("/admin", protect, admin, getAdminStats);

module.exports = router;
