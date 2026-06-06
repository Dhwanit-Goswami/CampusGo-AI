const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { auth } = require("../middleware/auth");

router.post("/request-payment", auth, paymentController.requestPayment);
router.post("/request-quick-payment", auth, paymentController.requestQuickPayment);
router.post("/passenger-paid", auth, paymentController.passengerPaid);
router.get("/my-earnings", auth, paymentController.myEarnings);

module.exports = router;
