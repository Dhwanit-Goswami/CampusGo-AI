const express = require("express");
const router = express.Router();
const rewardController = require("../controllers/reward.controller");
const { auth } = require("../middleware/auth");

router.get("/leaderboard", auth, rewardController.getLeaderboard);
router.get("/my-rewards", auth, rewardController.getUserRewards);
router.get("/logs", auth, rewardController.getPointsLogs);

module.exports = router;
