/* eslint-disable no-undef */
const express = require("express");
const { isAuthenticatedUser } = require("../middleware/auth");
const { processPayment } = require("../controllers/paymentController");
const router = express.Router();

router.route("/paymentProcess").post(isAuthenticatedUser, processPayment);

module.exports = router;
