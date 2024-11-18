const { type } = require("express/lib/response");
const mongoose = require("mongoose");



const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true,
    }
});

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    description: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    },


});

const ProductSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: false,
        unique: false,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    images: {
        type: [String],
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'category',
        required: true
    },
    size: {
        type: [String],
        required: false,
        enum: ['Small', 'Medium', "Large"]

    },
    status: {
        type: String,
        required: true,
        default: "Available",
        enum: ['Available', 'Out of Stock']
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: false
    },
    isListed: {
        type: Boolean,
        default: true
    },
    review: {
        type: String,
        required: false
    }
}, { timestamps: true });






const Admin = mongoose.model('admin', adminSchema);
const Category = mongoose.model('category', categorySchema);
const Product = mongoose.model('product', ProductSchema);

// module.exports = Admin;

module.exports = {
    Admin,
    Category,
    Product
}