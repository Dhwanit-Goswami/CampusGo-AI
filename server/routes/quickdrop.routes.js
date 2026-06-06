const express = require("express");
const router = express.Router();
const quickdropController = require("../controllers/quickdrop.controller");
const { auth } = require("../middleware/auth");

router.post("/request-quick-drop", auth, quickdropController.requestQuickDrop);
router.post("/accept-quick-drop", auth, quickdropController.acceptQuickDrop);
router.post("/start-quick-drop", auth, quickdropController.startQuickDrop);
router.post("/arrive-quick-drop", auth, quickdropController.arriveQuickDrop);
router.post("/complete-quick-drop", auth, quickdropController.completeQuickDrop);
router.post("/reject-quick-drop", auth, quickdropController.rejectQuickDrop);

module.exports = router;
