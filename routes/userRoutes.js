/* eslint-disable no-undef */
const apicache = require("apicache");
const express = require("express");
let cache = apicache.middleware;
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserDetails,
  updateUserPassword,
  updateUserProfile,
  getAllUsers,
  getSingleUserForAdmin,
  updateUserRole,
  deleteUser,
  googleAuth,
  deleteMyAccount,
  contactEmail,
} = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/auth/google").post(googleAuth);
router.route("/logout").get(logoutUser);
router.route("/contact").post(contactEmail);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/me").get(isAuthenticatedUser, getUserDetails);
router.route("/deleteMyProfile").delete(isAuthenticatedUser, deleteMyAccount);
router.route("/password/update").put(isAuthenticatedUser, updateUserPassword);
router.route("/updateMyProfile").put(isAuthenticatedUser, updateUserProfile);
router
  .route("/admin/users")
  .get(
    cache("5 minutes"),
    isAuthenticatedUser,
    authorizeRoles("admin"),
    getAllUsers
  );
router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUserForAdmin)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;
