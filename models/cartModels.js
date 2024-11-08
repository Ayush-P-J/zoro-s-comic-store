const { type } = require("express/lib/response");
const mongoose = require("mongoose");
const models = require('../models/adminModels');



const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product"
        },
        quantity: Number,
        productName: String,
        totalPrice: Number,

        active: {
            type: Boolean,
            default: true
        },
        modifiedOn: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

const Cart = mongoose.model('cart', cartSchema);

module.exports = {
    Cart,
}
