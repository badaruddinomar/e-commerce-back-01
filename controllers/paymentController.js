/* eslint-disable no-undef */
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
exports.processPayment = async (req, res) => {
  try {
    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "inr",
      metadata: {
        company: "Karma",
      },
    });
    res.status(200).json({
      success: true,
      message: "Success",
      client_secret: myPayment.client_secret,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
