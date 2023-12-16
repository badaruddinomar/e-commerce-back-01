/* eslint-disable no-undef */
const ApiFeatures = require("../utils/apiFeatures");
const Product = require("./../models/productModel");
const ErrorHandler = require("./../utils/errorHandler");
const cloudinary = require("../middleware/cloudinary");

// create product routes--Admin-route
exports.createProduct = async (req, res) => {
  try {
    let images = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
    const imagesLink = [];
    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.uploader.upload(images[i], {
        folder: "products",
      });
      imagesLink.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
    req.body.images = imagesLink;
    req.body.user = req.user.id;
    const product = await Product.create(req.body);

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
      success: false,
    });
  }
};

// get all products routes--
exports.getAllProducts = async (req, res) => {
  try {
    const resultPerPage = 8;
    const productsCount = await Product.countDocuments();
    const apiFeatures = new ApiFeatures(Product.find(), req.query)
      .search()
      .filter()
      .pagination(resultPerPage);
    let products = await apiFeatures.model;

    res.status(200).json({
      result: products.length,
      message: "All products are here",
      success: true,
      products,
      resultPerPage,
      productsCount,
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
      success: false,
    });
  }
};

// get single product--
exports.getSingleProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);

    // if product not found---
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product get successfully",
      success: true,
      product,
    });
  } catch (err) {
    res.status(404).json({
      message: "Product not found",
      success: false,
    });
  }
};

// update single product--Admin only
exports.updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    let product = await Product.findById(id);

    // if product not found---
    if (!product) {
      next(new ErrorHandler("Product not found!", 404));
      return;
    }
    // images functionality starts from here--
    if (req.body.images) {
      let images = [];
      if (typeof req.body.images === "string") {
        images.push(req.body.images);
      } else {
        images = req.body.images;
      }
      // deleting images from cloudinary --
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.uploader.destroy(product.images[i].public_id);
      }

      // saving updated images--
      const imagesLink = [];
      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.uploader.upload(images[i], {
          folder: "products",
        });
        imagesLink.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
      req.body.images = imagesLink;
    } else {
      req.body.images = product.images;
    }

    product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    });

    // product found--
    res.status(201).json({
      message: "Product updated",
      product,
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
      success: false,
    });
  }
};

// delete product--Admin only
exports.deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);

    // if product not found---
    if (!product) {
      next(new ErrorHandler("Product not found!", 404));
      return;
    }

    // deleting images from cloudinary --
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.uploader.destroy(product.images[i].public_id);
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
      success: false,
    });
  }
};

// Create new review--
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    const product = await Product.findById(req.body.productId);
    const isReviewed = product.reviews.find((rev) => {
      return rev.user.toString() === req.user._id.toString();
    });

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() === req.user._id.toString()) {
          return (rev.rating = rating), (rev.comment = comment);
        }
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
    // making average ratings of products--
    const totalRatings = product.reviews.reduce((acc, rev) => {
      return acc + rev.rating;
    }, 0);
    const avgRatings = totalRatings / product.reviews.length;
    product.ratings = avgRatings.toFixed(1);

    // Finally saving all the data--
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Review submitted Successfuly",
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
      success: false,
    });
  }
};

// Get ALl Review--
exports.getAllProductsReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.query.productId);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  } catch (err) {
    res.status(404).json({
      message: err.stack,
      success: false,
    });
  }
};

//  Delete Review--
exports.deleteReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.query.productId);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Filtering reviews for deleting--
    const reviews = product.reviews.filter((rev) => {
      console.log(rev._id.toString() !== req.query.revId.toString());
      return rev._id.toString() !== req.query.revId.toString();
    });
    console.log(reviews);

    // making average ratings of products--
    const totalRatings = reviews.reduce((acc, rev) => {
      return acc + rev.rating;
    }, 0);
    let avgRatings = totalRatings / reviews.length;
    const numOfReviews = reviews.length;
    if (totalRatings === 0 && reviews.length === 0) {
      avgRatings = 0;
    }

    console.log(reviews);
    console.log(totalRatings, avgRatings, numOfReviews);

    await Product.findByIdAndUpdate(
      req.query.productId,
      {
        reviews,
        ratings: avgRatings,
        numOfReviews,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
      success: false,
    });
  }
};
// get all products for admin--
exports.getAllProductsForAdmin = async (req, res, next) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      products,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 404));
  }
};
