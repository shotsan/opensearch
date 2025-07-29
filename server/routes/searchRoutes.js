const express = require("express");
const router = express.Router();
const {
  search,
  getSuggestions,
  getAnalytics,
  advancedSearch,
} = require("../controllers/searchController");

// Basic search
router.get("/", search);

// Get search suggestions
router.get("/suggestions", getSuggestions);

// Get search analytics
router.get("/analytics", getAnalytics);

// Advanced search
router.post("/advanced", advancedSearch);

module.exports = router;
