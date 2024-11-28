const order = require("../models/orderModels");
const cart = require("../models/cartModels");
const user = require("../models/userModels");
const admin = require("../models/adminModels");
const coupon = require("../models/couponModels");
const wallet = require("../models/walletModels");
const { type } = require("express/lib/response");

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
    const { addressId, paymentMethod, paymentStatus, amount, couponCode } =
      req.body;
    const userCart = await cart.Cart.find({ userId }).populate("productId");
    const userDetails = await user.User.findOne({ _id: userId });
    const userCoupon = await coupon.Coupon.findOne({ couponCode });

    console.log(userDetails);

    const selectedAddress = userDetails.addresses.find(
      (address) => address._id.toString() === addressId
    );
    const address = { ...selectedAddress._doc };
    address.addressId = address._id; // Add new field with renamed property

    delete address._id; // Or optionally rename it
    console.log("cart found ");
    console.log("address : " + address);

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

    

    console.log("stock updated");
    const orders = new order.Order({
      userId: userId,
      address: address,
      orderId: orderId,
      products: products,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,

      totalAmount: amount,
    });
    console.log("order saved1");
    await orders.save();
    console.log("order saved2");

    if(userCoupon){
      const coupons = {
        couponId: userCoupon.couponCode,
      };
      await user.User.updateOne(
        { _id: userId },
        { $push: { appliedCoupons: coupons } }
      );
    }

    await cart.Cart.deleteMany({ userId });
    console.log("order success");

    return res
      .status(200)
      .json({ success: true, message: "Order success..", orderId: orderId });
  } catch (error) {
    console.log("Something happenned" +error);
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

const orderReturn = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.session.userId;

    // Find the order by orderId

    const orders = await order.Order.findOne({ orderId });

    // Update stock for each product in the order
    await Promise.all(
      orders.products.map(async (product) => {
        await admin.Product.updateOne(
          { _id: product.productId },
          { $inc: { stock: product.quantity } }
        );
      })
    );

    // Update the order status to 'Returned'
    await order.Order.updateOne({ orderId }, { status: "Returned" });

    const userWallet = await wallet.Wallet.findOne({ userId });
    // let amount = 0;
    //     userDetails.transactions.forEach((user)=>{
    //       amount += user.amount
    //     })

    let amount = userWallet.balance + orders.totalAmount;
    const description = "skdjhfksj";

    const transaction = {
      type: "credit",
      amount: orders.totalAmount,
      description: description,
    };

    await wallet.Wallet.updateOne(
      { userId: userId },
      { balance: amount, $push: { transactions: transaction } }
    );

    // Respond with success
    return res
      .status(200)
      .json({
        success: true,
        message: "The order has been returned successfully.",
      });
  } catch (error) {
    console.error("Error returning order:", error);
    return res.status(500).json({
      success: false,
      message: "There was an issue returning the orders. Please try again.",
    });
  }
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

const walletTransaction = async (req, res) => {
  const { amount } = req.body;
  const userId = req.session.userId;

  try {
    // Fetch the user's wallet
    const wallets = await wallet.Wallet.findOne({ userId });
    console.log("wallet payment");
    
    if (!wallets) {
      return res
      .status(200)
      .json({ success: false, message: "Wallet not found." });
    }
    
    // Check if the wallet has sufficient balance
    if (wallets.balance < amount) {
      console.log("wallet is less");
      return res
      .status(200)
      .json({ success: false, message: "Insufficient wallet balance." });
    }
    
    // Deduct the amount from the wallet balance
    wallets.balance -= amount;
    
    // Add a transaction entry
    const transaction = {
      type: "debit",
      amount,
      description: "Order Payment",
      date: new Date(),
    };
    wallets.transactions.push(transaction);
    
    console.log("wallet pushed");
    // Save the updated wallet
    await wallets.save();
    
    console.log("wallet saved");
    // Send the transaction ID back to the client
    res.status(200).json({ success: true, transactionId: transaction._id });
  } catch (error) {
    console.error("Error processing wallet transaction:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  placeOrder,
  orderConfirmationPage,
  orderCancel,
  orderReturn,
  getOrders,
  changeOrderStatus,
  walletTransaction,
};
