const order = require("../models/orderModels");
const cart = require("../models/cartModels");
const user = require("../models/userModels");
const admin = require("../models/adminModels");
const coupon = require("../models/couponModels");
const wallet = require("../models/walletModels");
const { type } = require("express/lib/response");
const PDFDocument = require("pdfkit");
const fs = require('fs');
const path = require('path');
const Razorpay = require('razorpay');



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

    if(amount >= 1000 && paymentMethod == "COD"){
      return res
      .status(200)
      .json({ success: false, message: "The order is more than 1000 Rs, you can proceed with online payment " });
    }
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
    console.log("order id "+orderId);
    

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
    const description = "Order return";

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

const razorpayPayment = async (req, res)=>{
  try {
      const { amount, currency, receipt } = req.body;
      console.log("reached on razorPay: "+req.body);
      console.log(amount);
      
      
      const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID, // Replace with your Razorpay key ID
          key_secret: process.env.RAZORPAY_KEY_SECRET, // Replace with your Razorpay secret
        });
        console.log(process.env.RAZORPAY_KEY_ID);
        

        const order = await rzp.orders.create({
            amount: amount * 100, // Convert to paise
            currency: currency,
            receipt: receipt,
            payment_capture: 1,
        });
        console.log(order);
        
    
        res.status(201).json({ success: true, order: order,key:process.env.RAZORPAY_KEY_ID });
      } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: error.message });
      }
     
}

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


const viewOrders = async (req, res) => {
  try {
    console.log("view");
    
    const { orderId } = req.params;
    const orderDetails = await order.Order.findOne({ orderId }).populate('products.productId');
    if (!orderDetails){
console.log("no order");

return  res.status(404).json({ error: 'Order not found' });
}  

console.log(" order"+orderDetails);

    res.json(orderDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the order details' });
  }
}


const invoiceDownload = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch the order details from the database
    const orderDetails = await order.Order.findOne({ orderId })
      .populate("userId")
      .populate("products.productId");

    if (!orderDetails) {
      return res.status(404).send("Order not found");
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice_${orderDetails.orderId}.pdf"`
    );

    // Pipe the PDF into the response
    doc.pipe(res);

    // Add invoice title
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown(2);

    // Add Order Details
    doc.fontSize(12).text(`Order ID: ${orderDetails.orderId}`);
    doc.text(`Order Date: ${new Date(orderDetails.createdAt).toLocaleDateString()}`);
    doc.text(`Status: ${orderDetails.status}`);
    doc.text(`Total Amount: ₹${orderDetails.totalAmount}`);
    doc.moveDown();

    // Add User Details
    doc.fontSize(14).text("Customer Details", { underline: true });
    doc.fontSize(12).text(`Name: ${orderDetails.userId.fullName}`);
    doc.text(`Email: ${orderDetails.userId.email}`);
    doc.text(`Address: ${orderDetails.address.recipientName}, ${orderDetails.address.addressLine}, ${orderDetails.address.city}, ${orderDetails.address.state} - ${orderDetails.address.pinCode}`);
    doc.moveDown();

    // Add Products Table Header
    doc.fontSize(14).text("Products", { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const colWidths = [50, 200, 80, 100, 100]; // Column widths
    const headers = ["#", "Product Name", "Quantity", "Price", "Total"];

    // Draw table header background
    doc.rect(50, tableTop, colWidths.reduce((a, b) => a + b), 20).fill("#eeeeee");

    // Add table headers
    headers.forEach((header, i) => {
      const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.fontSize(10).fill("#000").text(header, x + 5, tableTop + 5);
    });

    // Reset fill color for rows
    doc.fill("#000");

    // Add Products Table Rows
    let rowTop = tableTop + 20;
    orderDetails.products.forEach((product, index) => {
      const rowData = [
        index + 1,
        product.productId?.productName || "N/A",
        product.quantity,
        `₹${product.priceAtPurchase}`,
        `₹${product.quantity * product.priceAtPurchase}`,
      ];

      // Draw row background alternately
      doc.rect(50, rowTop, colWidths.reduce((a, b) => a + b), 20).fill(index % 2 === 0 ? "#f9f9f9" : "#ffffff").stroke();

      // Add row text
      rowData.forEach((data, i) => {
        const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.fontSize(10).fill("#000").text(data, x + 5, rowTop + 5);
      });

      rowTop += 20;

      // Add a new page if the table exceeds the page height
      if (rowTop > doc.page.height - 50) {
        doc.addPage();
        rowTop = 50; // Reset rowTop for the new page
      }
    });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.status(500).send("Error generating invoice");
  }
};


const failedPayment = async (req, res) => {
  console.log("reached on FailedPayment");

  try {
    const orderId = generateOrderId();
    console.log("reached on FailedPayment 1");

    const userId = req.session.userId;
    const { addressId, paymentMethod, paymentStatus, amount, couponCode } =
      req.body;

    // Check if payment status is failed
    if (paymentStatus !== "Failed") {
  console.log("reached on FailedPayment not failed");

      return res
        .status(400)
        .json({ success: false, message: "Invalid payment status" });
    }

    const userCart = await cart.Cart.find({ userId }).populate("productId");
    const userDetails = await user.User.findOne({ _id: userId });
    const userCoupon = await coupon.Coupon.findOne({ couponCode });
  console.log("reached on FailedPayment 2");


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
      
    });

    

    const orders = new order.Order({
      userId: userId,
      address: address,
      orderId: orderId,
      products: products,
      status:"Payment Failed",
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
    console.log("order id "+orderId);
    

    return res
    .status(200)
    .json({ success: false, message: "Payment failed. Please try again." });


    
  } catch (error) {
    console.log("Something happened: " + error);
    return res
      .status(500)
      .json({ success: false, message: "Internal error occurred" });
  }
};

const retryPayment = async (req, res)=>{
  try {
      const { orderId  } = req.body;

      console.log("reached on razorPay retry: "+req.body);

      const userOrder = await order.Order.findOne({orderId:orderId}) 

      const amount = userOrder.totalAmount
      console.log("dsfdsf"+userOrder);
      

      
      
      const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID, // Replace with your Razorpay key ID
          key_secret: process.env.RAZORPAY_KEY_SECRET, // Replace with your Razorpay secret
        });

        const orders = rzp.orders.create({
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: "userOrder.userId.fullName",
            payment_capture: 1,
        });
    
        res.status(201).json({ success: true, order: orders, key: process.env.RAZORPAY_KEY_ID });
      } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: error });
      }
     
}

const retrySuccess = async (req, res)=>{
  try {
    const orderId = req.body.orderId;
    const userOrder = order.Order.findOne({orderId}).populate('userId') 

    await order.Order.updateOne(
      { orderId: orderId },
      {
        $set: {
          paymentStatus: "Success",
          status: "Order placed",
        },
      }
    );

    userOrder.products.forEach( async (product)=>{
      await admin.Product.updateOne(
        { _id: product.productId },
        { $inc: { stock: -product.quantity } }
      );    
    })




    return res
      .status(200)
      .json({ success: true, message: "Order success..", orderId: orderId });

  } catch (error) {
    
  }

}


module.exports = {
  placeOrder,
  orderConfirmationPage,
  orderCancel,
  orderReturn,
  getOrders,
  changeOrderStatus,
  walletTransaction,
  viewOrders,
  invoiceDownload,
  razorpayPayment,
  failedPayment,
  retryPayment,
  retrySuccess,
};
