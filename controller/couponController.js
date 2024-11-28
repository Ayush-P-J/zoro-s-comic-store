const coupon = require("../models/couponModels");
const cart = require("../models/cartModels");
const user = require("../models/userModels");
const { count } = require("console");

const getCouponAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const total = await coupon.Coupon.countDocuments();
    const error = "";
    const coupons = await coupon.Coupon.find().skip(skip).limit(limit);

    res.render("admin/coupon", {
      coupons,
      error: error,
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {}
};

const addCoupon = async (req, res) => {
  try {
    const {
      couponName,
      couponCode,
      description,
      discountType,
      discountValue,
      minAmount,
      maxAmount,
      totalLimit,
      perUserLimit,
      expiryDate,
    } = req.body;
    console.log(req.body);

    const isExist = await coupon.Coupon.findOne({ couponCode });

    if (isExist) {
      return res
        .status(200)
        .json({ success: false, message: "This coupon already exists" });
    }

    const newCoupon = new coupon.Coupon({
      couponName,
      couponCode,
      description,
      discountType,
      discountValue,
      minCartValue: minAmount,
      maxCartValue: maxAmount,
      totalUsageLimit: totalLimit,
      perUserLimit,
      expiryDate,
    });

    console.log("coupon saved");
    await newCoupon.save();
    return res
      .status(200)
      .json({ success: true, message: "Coupon added successfully" });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ success: false, message: "Coupon added successfully" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    console.log("apply coupon");

    const userId = req.session.userId;
    const couponCode = req.body.couponCode;
    const userCoupon = await coupon.Coupon.findOne({ couponCode });
    console.log(userCoupon);
    
    const userDetails = await user.User.findOne({_id:userId})

    if (!userCoupon) {
      return res
        .status(200)
        .json({ success: false, message: "The coupon not valid" });
    }
    let usedCount = 0
    console.log(userDetails.appliedCoupons);
    
    userDetails.appliedCoupons.forEach((coupon)=>{
      if(coupon.couponId == userCoupon.couponCode){
        usedCount++;
         
       }
    })
    if(usedCount === userCoupon.perUserLimit){
      return res
        .status(200)
        .json({ success: false, message: "The coupon is already used until the limit" });    
    }

    if (userCoupon.expiryDate < Date.now()) {
      return res
        .status(200)
        .json({ success: false, message: "The coupon expired" });
    }

    const userCart = await cart.Cart.find({ userId });

    if (userCart.totalPrice < userCoupon.minCartValue) {
      return res
        .status(200)
        .json({ success: false, message: "The cart amount is low " });
    }

    if (userCoupon.discountType === "PERCENTAGE") {
      const checkout = userCart.reduce((acc, cart) => acc + cart.totalPrice, 0);
      const discount =
        (checkout * userCoupon.discountValue) / 100 > userCoupon.maxCartValue
          ? userCoupon.maxCartValue
          : (checkout * userCoupon.discountValue) / 100;
      const totalPrice = checkout - discount;
console.log("kjhkj"+userCoupon.couponCode);

      
      console.log("pecent");
      console.log("coupon"+coupon);

      return res.status(200).json({
        success: true,
        message: "The coupon applied successfully ",
        totalPrice,
      });
    } else if (userCoupon.discountType === "FIXED") {
      const checkout = userCart.reduce((acc, cart) => acc + cart.totalPrice, 0);
      console.log("pecentsdaf");

      const totalPrice = checkout - userCoupon.discountValue;
console.log("kjhkj"+userCoupon.couponCode);

// const coupons = {
//   couponId:userCoupon.couponCode
// }
//       await user.User.updateOne(
//         { _id: userId },
//         { $push: { appliedCoupons: coupons } }
//       );
      return res.status(200).json({
        success: true,
        message: "The coupon applied successfully ",
        totalPrice,
      });
    }
  } catch (error) {
    console.log(error);
    console.log("error");

    return res
      .status(200)
      .json({ success: true, message: "Something error happenned" });
  }
};

const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.userId;

    const userCart = await cart.Cart.find({ userId });

    const totalPrice = userCart.reduce((acc, cart) => acc + cart.totalPrice, 0);
    return res.status(200).json({
      success: true,
      message: "The coupon applied successfully ",
      totalPrice,
    });
  } catch (error) {}
};


const { Coupon } = require('../models/couponModels');

// Update Coupon Status
const updateStatus = async (req, res) => {
  const { couponId, status } = req.body;

  if (!couponId || !['Activated', 'Deactivated'].includes(status)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    coupon.status = status;
    await coupon.save();

    return res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating coupon status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
  getCouponAdmin,
  addCoupon,
  applyCoupon,
  removeCoupon,
  updateStatus,
};
