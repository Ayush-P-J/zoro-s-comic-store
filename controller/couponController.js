const coupon = require("../models/couponModels");


const getCouponAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const total = await coupon.Coupon.countDocuments();
    const error = "";
    const coupons = await coupon.Coupon.find().skip(skip).limit(limit)




    res.render("admin/coupon", {
        coupons,
      error: error,
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {

  }
};


const addCoupon = async (req, res)=>{
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

const isExist = await coupon.Coupon.findOne({couponCode})

if(isExist){
            return res.status(200).json({success: false,message: 'This coupon already exists'})
        }
        
        const newCoupon = new coupon.Coupon({
            couponName,
            couponCode,
            description,
            discountType,
            discountValue,
            minCartValue :minAmount ,
            maxCartValue :maxAmount,
            totalUsageLimit :totalLimit,
            perUserLimit,
            expiryDate,
            
        });
        
        console.log("coupon saved");
        await newCoupon.save();
        return res.status(200).json({success: true,message: 'Coupon added successfully'})
        
        
    } catch (error) {
        console.log(error);
        
        return res.status(500).json({success: false,message: 'Coupon added successfully'})
    }
}



module.exports = {
    getCouponAdmin,
    addCoupon,
}


