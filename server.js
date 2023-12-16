/* eslint-disable no-undef */
// ALl imports starts from here--
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config({ path: "./config.env" });
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middleware/error");
const productRoute = require("./routes/productRoutes");
const userRoute = require("./routes/userRoutes");
const paymentRoute = require("./routes/paymentRoute");
const orderRoute = require("./routes/orderRoute");
const compression = require("compression");
const helmet = require("helmet");
const fileUpload = require("express-fileupload");
const { frontendUrl } = require("./helper.js");
// All imports end here---

const app = express();

// Enable CORS for all routes--

const corsOptions = {
  origin: frontendUrl,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204,
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", `${frontendUrl}`);
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

app.use(express.json());
app.use(fileUpload());
app.use(cookieParser());

// import frontend build folder--
app.use(express.static("dist"));

// handling uncaught exceptions--
process.on("uncaughtException", (err) => {
  console.log(`error: ${err.message}`);
  console.log(`Uncaught exception: ${err.stack}`);
  process.exit(1);
});

// some secret variables--
const db = process.env.DB;

// DB connection ---
mongoose
  .connect(db, {
    useNewUrlParser: true,
  })
  .then(() => console.log("database connected!"))
  .catch((err) => console.log(err.message));

// all root routes--
app.use("/api/v1", productRoute);
app.use("/api/v1", userRoute);
app.use("/api/v1", orderRoute);
app.use("/api/v1", paymentRoute);

// middleware for errors--
app.use(errorMiddleware);

const server = app.listen(process.env.PORT, () => {
  console.log(`server running on port ${process.env.PORT}`);
});

// unhandled promise rejection--
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err}`);
  console.log(`Shuting down the server due to unhandled promise rejection!`);

  server.close(() => {
    process.exit(1);
  });
});
