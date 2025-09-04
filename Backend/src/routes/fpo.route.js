// src/routes/fpo.route.js
const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { getFpoStats } = require("../controllers/fpo.controller");

const router = express.Router();

router.get("/stats", authenticate, authorize("fpo"), getFpoStats);

module.exports = router;
