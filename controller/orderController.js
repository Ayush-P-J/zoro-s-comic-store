const order = require("../models/orderModels");
const cart = require("../models/cartModels");
const admin = require("../models/adminModels");

function generateOrderId() {
  const prefix = "ORD";
  const timestamp = Date.now(); // Gets the current timestamp in milliseconds
  return `${prefix}${timestamp}`;
}

// Example usage:

const placeOrder = async (req, res) => {
  console.log("reached on PlaceOrder");

  try {
    const orderId = generateOrderId();
    const userId = req.session.userId;
    const { addressId, paymentMethod } = req.body;
    const userCart = await cart.Cart.find({ userId }).populate("productId");

    const products = [];
    let totalAmount = 0;
    userCart.forEach(async (cart) => {
      const product = {
        productId: cart.productId._id,
        productName: cart.productName,
        quantity: cart.quantity,
        priceAtPurchase: cart.totalPrice,
      };
      products.push(product);
      totalAmount += cart.totalPrice;
      await admin.Product.updateOne(
        { _id: cart.productId._id },
        { $inc: { stock: -cart.quantity } }
      );
    });

    const orders = new order.Order({
      userId: userId,
      addressId: addressId,
      orderId: orderId,
      products: products,
      paymentMethod: paymentMethod,
      totalAmount: totalAmount,
    });
    await orders.save();

    await cart.Cart.deleteMany({ userId });

    return res
      .status(200)
      .json({ success: true, message: "Order success..", orderId: orderId });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal error occured" });
  }
};

const orderConfirmationPage = async (req, res) => {
  const orderId = req.params.orderId;
  const orderDetails = await order.Order.findOne({ orderId }).populate(
    "userId"
  );
  console.log("orders in confirmation" + orderDetails);

  return res.render("user/orderConfirmation", { orderDetails });
};

const orderCancel = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const products = req.body.products;
    const userId = req.session.userId;
    const orders = await order.Order.findOne({ orderId });
    orders.products.forEach(async (product) => {
      await admin.Product.updateOne(
        { _id: product.productId },
        { $inc: { stock: product.quantity } }
      );
    });
    console.log("oder cancel" + products + orderId);

    await order.Order.updateOne({ orderId }, { status: "Cancelled" });

    return res
      .status(200)
      .json({ success: true, message: "The order cancelled" });
  } catch (error) {}
};

const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    // const items = await user.User.find().skip(skip).limit(limit);
    const total = await order.Order.countDocuments();
    // console.log(total);
    const error = "";
    const orders = await order.Order.find()
      .skip(skip)
      .limit(limit)
      .populate("userId");
    // console.log(categories)
    res.render("admin/orders", {
      orders,
      error: error,
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {}
};

const changeOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    console.log("reached change OrderStatus");

    const updatedOrder = await order.Order.updateOne(
      { orderId },
      { status: status }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {}
};








module.exports = {
  placeOrder,
  orderConfirmationPage,
  orderCancel,
  getOrders,
  changeOrderStatus,
};
