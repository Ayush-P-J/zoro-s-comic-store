const { type } = require("express/lib/response");
const mongoose = require("mongoose");
const models = require('../models/adminModels');



const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product"
        },
        productName: String,
        active: {
            type: Boolean,
            default: false
        },
        modifiedOn: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

const Wishlist = mongoose.model('wishlist', wishlistSchema);

module.exports = {
    Wishlist,
}
