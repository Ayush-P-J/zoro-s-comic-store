const { type } = require('express/lib/response');
const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }, orderId: {
        type: String
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true
            },
            productName: {
                type: String
            },
            quantity: {
                type: Number,
                default: 1
            },
            priceAtPurchase: {
                type: Number,
                required: true // Price of the product at the time of purchase
            }
        }
    ],
    status: {
        type: String,
        enum: ["Order Placed", "Cancelled", "Processing", "Shipped", "Out for delivery", "Delivered", "Returned"],
        required: true,
        default: "Order Placed"
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "Debit Card", "Internet Banking", "UPI", "Wallet"],
        required: true,
        default: "COD"
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    shippingAmount: {
        type: Number,
        default: 0
    },
    // createdAt:{
    //     type:String,
    //     required:true
    // },
    coupons: [
        {
            couponId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'coupon'
            },
            appliedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    appliedOffers: [
        {
            offerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'offer'
            },
            appliedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true })

const Order = mongoose.model('order', orderSchema)

module.exports = {
    Order
}