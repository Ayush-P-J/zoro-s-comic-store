const wishlist = require('../models/wishlistModels');


const getWishlistPage = async (req, res)=>{
    const userId = req.session.userId;
    const wish = await wishlist.Wishlist.find({ userId }).populate('productId')

    res.render('user/wishlist', { wish  })
}


const addToWishlist = async (req ,res)=>{
    
}


module.exports = {
    getWishlistPage
}