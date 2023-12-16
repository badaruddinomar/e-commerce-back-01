/* eslint-disable no-undef */
const Order = require("./../models/orederModel");
const Product = require("./../models/productModel");
const ErrorHandler = require("./../utils/errorHandler");

// Create new Order---
exports.createOrder = async (req, res) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      order,
      message: "Your order successfully created",
    });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// Get single order--
exports.getSingleOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return next(
        new ErrorHandler("order not found with this id: " + req.params.id, 404)
      );
    }
    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// Get logged in user orders--
exports.myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id });

    if (!orders) {
      next(new ErrorHandler("Order not found", 404));
    }
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};

// Get all orders for -- Admin--
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();

    let totalAmount = 0;
    orders.forEach((order) => {
      totalAmount += order.totalPrice;
    });

    res.status(200).json({
      success: true,
      totalAmount,
      orders,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};
// order stock changing function--
async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.stock = product.stock - quantity;

  await product.save({ validateBeforeSave: false });
}

// update order status -- Admin--
exports.updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order.orderStatus === "Delivered") {
      return next(
        new ErrorHandler("You have already delivered this order", 400)
      );
    }

    // product changing by this function--
    order.orderItems.forEach(async (order) => {
      await updateStock(order.productId, order.productQuantity);
    });

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Order Updated Successfuly",
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete order by Admin--
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(
        new ErrorHandler("Order not found with the id " + req.params.id, 404)
      );
    }

    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};
