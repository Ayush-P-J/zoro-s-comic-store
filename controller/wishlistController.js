const wishlist = require("../models/wishlistModels");
const admin = require("../models/adminModels");
const cart = require('../models/cartModels');


const getWishlistPage = async (req, res) => {
  const userId = req.session.userId;
  const products = await admin.Product.find({ isListed: true }).populate('category')
  const userCart = await cart.Cart.find({ userId }).populate('productId')
  const wish = await wishlist.Wishlist.find({ userId }).populate("productId");

  res.render("user/wishlist", { wish, userCart, products });
};

const addToWishlist = async (req, res) => {
  console.log("wishlist");
  try {
    const { productId, active } = req.body;
    console.log(active);
    
    const userId = req.session.userId;
      const product = await admin.Product.findOne({ _id: productId });

      const isInWishlist = await wishlist.Wishlist.findOne({
        userId,
        productId,
      }).populate("productId");
      console.log("isthis ");

      if (isInWishlist) {
        await wishlist.Wishlist.deleteOne({userId,productId})
        return res.status(200).json({ success: true, message: "successfully removed from wishlist" });
      }

      const userWishlist = new wishlist.Wishlist({
        userId,
        productId,
      });

      await userWishlist.save();

      console.log("Added to wishlist");
      return res.status(200).json({ success: true, message: "successfully added to wishlist" });
    
  } catch (error) {
    return res.status(500).json({ error: "something error" });
  }
};

module.exports = {
  getWishlistPage,
  addToWishlist,
};
