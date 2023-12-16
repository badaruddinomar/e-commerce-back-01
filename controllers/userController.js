/* eslint-disable no-undef */
const ErrorHandler = require("./../utils/errorHandler");
const User = require("./../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("./../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("../middleware/cloudinary");
const { frontendUrl } = require("./../helper");

// Register a user--
exports.registerUser = async (req, res, next) => {
  try {
    if (!req.body.avatar) {
      next(new ErrorHandler("Please upload your avatar", 400));
      return;
    }
    const cloudImage = await cloudinary.uploader.upload(req.body.avatar, {
      resource_type: "auto",
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    const { name, email, password } = req.body;
    if (name === "" || email === "" || password === "") {
      next(new ErrorHandler("Please fill all fields", 400));
      return;
    }
    const user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: cloudImage.public_id,
        url: cloudImage.secure_url,
      },
    });
    const message = "Signup successful";
    sendToken(user, 201, res, message);
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// login user--
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // if email and password exist--
    if (!email || !password) {
      next(new ErrorHandler("Please enter Email & password", 400));
      return;
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      next(new ErrorHandler("Invalid email or password", 400));
      return;
    }

    // check password is matched or not--
    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      next(new ErrorHandler("Invalid email or password", 400));
      return;
    }
    const message = "Login successful";
    sendToken(user, 200, res, message);
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};
// Google auth--
exports.googleAuth = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    console.log(user);
    if (user) {
      sendToken(user, 200, res, "Login successful");
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8);
      const generatedUsername =
        req.body.name.split(" ").join("").toLowerCase() +
        Math.floor(Math.random() * 10000).toString();

      const newUser = await User.create({
        name: generatedUsername,
        email: req.body.email,
        password: generatedPassword,
        avatar: {
          public_id: "default-avatar" + Date.now(),
          url: req.body.avatar,
        },
      });
      sendToken(newUser, 201, res, "Signup successful");
    }
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};
// Logout user ---
exports.logoutUser = async (req, res) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "Sign out successful",
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// Forgot password ---
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      next(new ErrorHandler("User not found", 404));
      return;
    }
    // Get reset passwprd token--
    const resetToken = await user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // const resetPasswordUrl = `${req.protocol}://${req.get(
    //   "host"
    // )}/api/v1/password/reset/${resetToken}`;
    const resetPasswordUrl = `${frontendUrl}/resetPassword/${resetToken}`;

    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n if you have not requested this email then please ignore this email.`;

    try {
      await sendEmail({
        senderEmail: process.env.SMPT_MAIL,
        email: user.email,
        subject: "E-commerce password Recovery",
        message,
      });
      res.status(200).json({
        success: true,
        message: `Message sent to ${user.email} successfully`,
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorHandler(err.message, 500));
    }
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// Reset password--
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    console.log(resetPasswordToken === req.params.token);

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorHandler(
          `Reset password token is invalid or has been expired`,
          404
        )
      );
    }
    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(
        new ErrorHandler(
          "Password and confirm password should be the same",
          400
        )
      );
    }
    user.password = req.body.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    const message = "Password reset successful";
    sendToken(user, 200, res, message);
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// Get user details --
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      next(new ErrorHandler("User not found", 404));
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// update user password--
exports.updateUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("+password");
    // check password is matched or not--
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Previous  password is incorrect", 401));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(
        new ErrorHandler(
          "New password and confirm password should be the same",
          401
        )
      );
    }

    user.password = req.body.newPassword;
    await user.save();
    const message = "Password has been updated";
    sendToken(user, 200, res, message);
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// update user profile--
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userDoc = await User.findById(req.user.id);
    let cloudImage;
    // destroy the image--
    if (req.body.avatar) {
      cloudinary.uploader.destroy(userDoc.avatar.public_id, (error) => {
        if (error) {
          next(new ErrorHandler("Can't upload image", 400));
          return;
        }
      });
    }
    // upload the new image--
    if (req.body.avatar) {
      cloudImage = await cloudinary.uploader.upload(req.body.avatar, {
        resource_type: "auto",
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
    }
    // get new user data--
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
      avatar: {
        public_id: req.body.avatar
          ? cloudImage.public_id
          : userDoc.avatar.public_id,
        url: req.body.avatar ? cloudImage.secure_url : userDoc.avatar.url,
      },
    };
    // finally updata the data--
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    // send the response to the user--
    const message = "Profile has been updated";
    sendToken(user, 200, res, message);
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// delete user account --
exports.deleteMyAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    // destroy the image--
    cloudinary.uploader.destroy(user.avatar.public_id, (error) => {
      if (error) {
        next(new ErrorHandler("Image is not deleted", 400));
        return;
      }
    });

    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({
      success: true,
      message: "Account suucessfully deleted",
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// Get all users--admin--
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// Get single users--admin--
exports.getSingleUserForAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      next(new ErrorHandler("User not found", 400));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// update user role--Admin
exports.updateUserRole = async (req, res) => {
  try {
    const newUserData = {
      role: req.body.role,
    };

    // we will add cloudinary later--
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(201).json({
      success: true,
      message: "User role has been updated",
      user,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};

// Delete user --- Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndRemove(req.params.id);

    // we will cloudinary--
    if (!user) {
      return next(new ErrorHandler(`User does not exist ID: ${req.params.id}`));
    }

    res.status(200).json({
      success: true,
      message: "User suucessfully deleted",
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};
// get email from user--
exports.contactEmail = async (req, res, next) => {
  try {
    await sendEmail({
      senderEmail: req.body.email,
      email: process.env.SMPT_MAIL,
      subject: req.body.subject,
      message: req.body.message,
    });
    res.status(200).json({
      success: true,
      message: `Message sent successfully`,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};
