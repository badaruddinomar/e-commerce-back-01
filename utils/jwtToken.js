/* eslint-disable no-undef */
// creating token and saving into the cookie--
const sendToken = (user, statusCode, res, message = null) => {
  const token = user.getJwtToken();
  // option for cookie--
  const options = {
    httpOnly: true,
    expiresIn: process.env.JWT_COOKIE_EXPIRATION,
    secure: true,
    sameSite: "None",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
    message,
  });
};

module.exports = sendToken;
