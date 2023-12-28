/* eslint-disable no-undef */
const apicache = require("apicache");
const express = require("express");
let cache = apicache.middleware;
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getSingleProduct,
  createProductReview,
  getAllProductsReviews,
  deleteReview,
  getAllProductsForAdmin,
} = require("../controllers/productController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const router = express.Router();

router
  .route("/admin/product/new")
  .post(
    cache("5 minutes"),
    isAuthenticatedUser,
    authorizeRoles("admin"),
    createProduct
  );

router.route("/products").get(cache("5 minutes"), getAllProducts);
router
  .route("/admin/product/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);
router
  .route("/admin/products")
  .get(
    cache("5 minutes"),
    isAuthenticatedUser,
    authorizeRoles("admin"),
    getAllProductsForAdmin
  );

router.route("/product/:id").get(cache("5 minutes"), getSingleProduct);

router.route("/review").put(isAuthenticatedUser, createProductReview);

router
  .route("/reviews")
  .get(getAllProductsReviews)
  .put(isAuthenticatedUser, deleteReview);

module.exports = router;
