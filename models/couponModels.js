const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        couponName: {
        type: String,
        required: true,
        maxlength: 50, // Limit to 50 characters
      },
      couponCode: {
        type: String,
        required: true,
        unique: true,
        maxlength: 50, // Matches the modal constraint
      },
      description: {
        type: String,
        maxlength: 500, // Optional field for a longer description
      },
      discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED'], // Only allow these two types
        required: true,
      },
      discountValue: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
      },
      minCartValue: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0, // Optional; if no minimum value is provided
      },
      maxCartValue: {
        type: mongoose.Schema.Types.Decimal128,
        default: null, // Optional; allows for an undefined max value
      },
      totalUsageLimit: {
        type: Number,
        default: null, // Optional; unlimited usage if not specified
      },
      perUserLimit: {
        type: Number,
        default: null, // Optional; unlimited per user if not specified
      },
      expiryDate: {
        type: Date,
        required: true, // Coupon must have an expiry date
      },
      status: {
        type: String,
        required: true,
        default: "Activated",
        enum: ['Deactivated', 'Activated']
    },
      
    },
    {
      timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
  );
 
const Coupon = mongoose.model('Coupon', couponSchema);


module.exports = {
    Coupon
}