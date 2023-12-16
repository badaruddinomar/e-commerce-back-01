/* eslint-disable no-undef */
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
exports.processPayment = async (req, res) => {
  try {
    console.log(req.body.amount);
    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "inr",
      metadata: {
        company: "Karma",
      },
    });
    console.log(myPayment.client_secret);
    res.status(200).json({
      success: true,
      message: "Success",
      client_secret: myPayment.client_secret,
    });
  } catch (err) {
    console.log(err);
  }
};
