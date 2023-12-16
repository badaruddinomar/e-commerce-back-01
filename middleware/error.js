/* eslint-disable no-undef */
const ErrorHandler = require("./../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  // wrong mongodb id error--
  if (err.name === "CastError") {
    const message = `Resource not found: ${err.path}`;
    err = next(new ErrorHandler(message, 400));
  }
  // mongoose duplicate key errors--
  if (err.code === 110000) {
    const message = `Duplicate ${object.keys(err.keyValue)} entered`;
    err = next(new ErrorHandler(message, 400));
  }
  // wrong jwt error--
  if (err.name === "JsonWebTokenError") {
    const message = `json web token is invalid try again`;
    err = next(new ErrorHandler(message, 400));
  }
  // jwt expires error--
  if (err.name === "TokenExpiredError") {
    const message = "Json web token expired";
    err = next(new ErrorHandler(message, 400));
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
