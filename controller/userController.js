const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")
const user = require('../models/userModels');
const admin = require('../models/adminModels');
const cart = require('../models/cartModels');
const wishlist = require('../models/wishlistModels');
const wallet = require('../models/walletModels');
const order = require('../models/orderModels');
const coupon = require("../models/couponModels");

const { error } = require("console");

const env = require("dotenv").config()

// let userEmail = "";

const getIndexPage = async (req, res) => {
  const categories = await admin.Category.find({ status: true })

  const products = await admin.Product.find({ isListed: true }).populate('category')

  res.render('user/index', { products ,categories});

}
const getHomePage = async (req, res) => {
  const userId = req.session.userId
  const categories = await admin.Category.find({ status: true })
  const products = await admin.Product.find({ isListed: true }).populate('category')
  const userCart = await cart.Cart.find({ userId }).populate('productId')
  const userWishlist = await wishlist.Wishlist.find({ userId }).populate('productId')
  

  console.log("User" + this.userEmail);


 
  res.status(200).render('user/home', { products, categories, userCart, userWishlist });

}

const pageNotFound = (req, res)=>{
  res.render('user/404')
}



//Get user login page 

const getLoginPage = async (req, res) => {

  if (req.session.email) {
    return res.redirect('/home');

  } else if (req.session.isBlocked) {

    return res.render('user/login', { success: false, message: 'This Email is blocked by the admin', title: "Login page" });
  } else if (req.session.isExist) {
    return res.render('user/login', { success: false, message: 'This user already exists', title: "Login page" })
  } else if (req.session.passChanged) {
    return res.render('user/login', { success: true, message: 'Password Changed Successfully', title: "Login page" })
  }
  return res.render('user/login', { success: "nothing", message: '', title: "Login page" });

};

const getForgotPage = (req, res) => {

  return res.render('user/forgotPassword', { success: true, message: "" });
}

const postForgotPass = async (req, res) => {
  const email = req.body.email;
  const userEmail = await user.User.findOne({ email: email })
  if (userEmail && !userEmail.googleId) {
    // if (userEmail.googleId){
    //   return res.render('user/forgotPassword', { success: false, message: "This Email is " })
    // }
    const otp = generateOtp()

    const emailSent = await sendVerificationEmail(email, otp);
    console.log("forget password Otp: " + otp);

    if (!emailSent) {
      return res.json("email-error")
    }
    req.session.userEmail = email
    req.session.userOtp = otp;
    req.session.otpExpires = Date.now() + 30 * 1000;
    return res.redirect('/forgotPasswordOtp')
  } else {
    return res.render('user/forgotPassword', { success: false, message: "Invalid Email!!!" })
  }

}

const getForgetPasswordOtp = async (req, res) => {
  return res.render('user/forgotPasswordOtp', { success: false, message: "" })
}

const forgetPassOtpVerify = async (req, res) => {
  try {
    const OTP = req.body.otp;
    req.session.userOtp = Date.now() > req.session.otpExpires ? null : req.session.userOtp;
    if (OTP === req.session.userOtp) {
      req.session.userOtp = null;

      return res.status(200).json({
        success: true,
        message: "Email verified",
        redirectUrl: "/changePassword"
      });
    } else if (req.session.userOtp === null) {
      return res.status(200).json({ success: false, message: "OTP expired" });
    } else {
      return res.status(200).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP", error);
    return res.status(500).json({ success: false, message: "An error occurred" });
  }
}


const getChangePassword = async (req, res) => {

  res.render('user/changePassword')
}

const postChangePassword = async (req, res) => {
  try {
    const password = req.body.password;
    console.log(password);
    const passwordHash = await securePassword(password);


    await user.User.updateOne({ email: req.session.userEmail }, { password: passwordHash })
    req.session.passChanged = true;
    res.redirect('/login')
  } catch (error) {
    console.log(error)
  }
}

const forgetPassResendOTP = async (req, res) => {
  try {

    console.log('reached forgetPassResendOTP');

    const email = req.session.userEmail;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email not found in session" })

    }
    console.log(" forgetPassResendOTP email: " + email);



    const otp = generateOtp()
    req.session.userOtp = otp

    const emailSend = await sendVerificationEmail(email, otp)
    if (emailSend) {
      console.log("Resend otp", otp);
      res.status(200).json({ success: true, message: "OTP Resend Successfully" })

    } else {
      res.status(200).json({ success: false, message: "Failed to OTP resend, Please try again" })
    }

  } catch (error) {
    console.log("Error for resend OTP", error);
    res.status(500)

  }
}

const postLogin = async (req, res) => {
  try {
    // const { USERNAME, FULLNAME, PASSWORD } = req.body;
    const email = req.body.email;
    const password = req.body.password
    console.log("email: " + email);

    // const PASSWORD = passwordHash;

    const userDetails = await user.User.findOne({ email: email });

    if (!userDetails) {
      return res.render('user/login', { message: 'Invalid Email', title: "Login page" });


    }

    if (userDetails.isBlocked === true) {
      req.session.isBlocked = true;
      return res.redirect('/login')
    }

  



    const userVerify = await bcrypt.compare(password, userDetails.password)
    console.log("user" + userVerify);

    if (userVerify) {
      req.session.email = true;
      this.userEmail = email
      req.session.userId = userDetails._id
      console.log("user: " + this.userEmail)



      // req.session.fullName = FULLNAME;

      res.redirect('/home');
    } else {
      return res.render('user/login', { message: ' Incorrect password', title: "Login page" });
    }
  } catch (error) {

    res.status(500).send("Internal server error")
  }

};

const googleLogin = async (req, res) => {
  const email = req.user.email
  this.userEmail = email

  const isExist = req.isExist
  console.log(email);
  console.log(isExist);

  const userDetails = await user.User.findOne({ email: email });
  req.session.userId = userDetails._id


  if (!userDetails.googleId) {
    req.session.isExist = true;
    return res.redirect('/login')

  }
  if (userDetails.isBlocked) {
    req.session.isBlocked = true;
    return res.redirect('/login')
    // return res.render('user/login', { message: 'This Email is blocked by the admin', title: "Login page" });

  }
  req.session.email = true;
  res.redirect('/home');
}







const getSignupPage = (req, res) => {

  res.render('user/signup', { message: "" });

};





const postSignup = async (req, res) => {

  const fullName = req.body.fullName;
  const userName = req.body.userName;
  const phone = req.body.phone;
  const email = req.body.email;
  const password = req.body.password;
  // const CONFIRMPASS = req.body.confirmPass;


  try {
    const existingUser = await user.User.findOne({ email: email });


    if (existingUser) {

      return res.render('user/signup', { message: "This email already has an account " });
    }

    const otp = generateOtp()

    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.json("email-error")
    }

    req.session.userOtp = otp;
    req.session.otpExpires = Date.now() + 30 * 1000;

    req.session.userData = { fullName, userName, phone, email, password };

    res.redirect("/verifyOTP")
    console.log("OTP send", otp)



  } catch (error) {
    console.log("Error for OTP creating", error)
    res.status(500).send("Internal server error")
  }

};


const getOTP = (req, res) => {
  res.render('user/otpPage', { errorMessage: "" });
}

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const securePassword = async (password) => {
  try {

    const passwordHash = await bcrypt.hash(password, 10)

    return passwordHash;

  } catch (error) {

  }
}



const sendVerificationEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your account", // Corrected typo
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP is ${otp}</b>` // Closed the <b> tag properly
    });

    return info.accepted.length > 0;

  } catch (error) {
    console.error("Error sending email", error);
    return false;
  }
}



const verifyOtp = async (req, res) => {
  try {
    const OTP = req.body.otp; // Ensure lowercase to match frontend
    console.log('AAAA');
    console.log(OTP);



    req.session.userOtp = Date.now() > req.session.otpExpires ? null : req.session.userOtp;
    const users = req.session.userData;

    if (OTP === req.session.userOtp) {
      const passwordHash = await securePassword(users.password);

      const newUser = new user.User({
        fullName: users.fullName,
        userName: users.userName,
        phone: users.phone,
        email: users.email,
        addresses: [],
        password: passwordHash,
      });

      await newUser.save();

      req.session.user = newUser._id;
      req.session.successMessage = "User registered successfully!";
      req.session.userOtp = null;
      req.session.userData = null;

      return res.status(200).json({
        success: true,
        message: "Email verified",
        redirectUrl: "/login"
      });

    } else if (req.session.userOtp === null) {
      return res.status(200).json({ success: false, message: "OTP expired" });
    } else {
      return res.status(200).json({ success: false, message: "Invalid OTP" });
    }

  } catch (error) {
    console.error("Error verifying OTP", error);
    return res.status(500).json({ success: false, message: "An error occurred" });
  }
};



const resendOTP = async (req, res) => {
  try {

    console.log('email');

    const { email } = req.session.userData
    if (!email) {
      return res.status(400).json({ success: false, message: "Email not found in session" })

    }
    console.log(email);



    const otp = generateOtp()
    req.session.userOtp = otp

    const emailSend = await sendVerificationEmail(email, otp)
    if (emailSend) {
      console.log("Resend otp", otp);
      res.status(200).json({ success: true, message: "OTP Resend Successfully" })

    } else {
      res.status(200).json({ success: false, message: "Failed to OTP resend, Please try again" })
    }

  } catch (error) {
    console.log("Error for resend OTP", error);
    res.status(500)

  }
}

const viewProduct = async (req, res) => {
  const productId = req.params.id;
  const userId = req.session.userId;
  const isLoggedIn = userId ? true : false;
  const product = await admin.Product.findOne({ _id: productId }).populate('category');
  const userCart = await cart.Cart.find({ userId }).populate('productId')
  const userWishlist = await wishlist.Wishlist.find({ userId }).populate('productId')



  const products = await admin.Product.find({
    category: product.category,
    isListed: true,
    _id: { $ne: productId }
  }).limit(3)

  res.render('user/viewProduct', { product, products, userCart ,userWishlist, isLoggedIn})
}

const getCategoryUser  = async (req, res) => {
  const sortOption = req.query.sortBy;
  const searchTerm = req.query.search || ''; // Get the search term from query
  let sortCriteria;
  const categories = await admin.Category.find({ status: true })
const categoryId = await req.query.category 

  switch (sortOption) {
    case 'popularity':
      sortCriteria = { popularity: -1 };
      break;
    case 'price-low-high':
      sortCriteria = { salePrice: 1 };
      break;
    case 'price-high-low':
      sortCriteria = { salePrice: -1 };
      break;
    case 'newest-first':
      sortCriteria = { createdAt: -1 };
      break;
    case 'aA-zZ':
      sortCriteria = { productName: 1 };
      break;
    case 'zZ-aA':
      sortCriteria = { productName: -1 };
      break;
    default:
      sortCriteria = {};
  }
  let products;
  // Find products based on the search term
  if(categoryId){
     products = await admin.Product.find({
      isListed: true,
      category:categoryId,
      productName: { $regex: searchTerm, $options: 'i' } // Case-insensitive search
    }).sort(sortCriteria).populate('category');
  }else{
     products = await admin.Product.find({
      isListed: true,
      productName: { $regex: searchTerm, $options: 'i' } // Case-insensitive search
    }).sort(sortCriteria).populate('category');
  }

  res.render('user/categories', { products, sortOption, searchTerm,categories,categoryId });
}


const getProfilePage = async (req, res) => {
  // const userId = this.userEmail
  const userId = req.session.userId;
  const coupons = await coupon.Coupon.find({expiryDate:{$gt:Date.now()}})
  const userData = await user.User.findOne({ _id: userId })
  const orderDetails = await order.Order.find({ userId }).populate('userId').sort({createdAt:-1})
  const userWallet = await wallet.Wallet.findOne({userId});
  const userWishlist = await wishlist.Wishlist.find({ userId }).populate('productId')


  // console.log("kkkk"+userWallet);
  
  
    if(!userWallet){
      console.log("wallte");
    
    const myWallet = new wallet.Wallet ({
      userId:userId,
    })
    await myWallet.save();
    }
    
    
  
  
  const wallets = await wallet.Wallet.findOne({userId});

  if (wallets) {
    wallets.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

  

  
  // console.log("aa ithaa" + userData);
  // console.log("szdfd"+orderDetails.);

  res.render('user/profile', { userData, orderDetails,coupons, wallets,userWishlist });
}

// const editProfile = async (req, res) => {
//   try {
//     const { fullName, userName, phoneNumber } = req.body;

//     await user.User.updateOne({ email: this.userEmail }, { fullName, userName, phone: phoneNumber });


//     return res.redirect('/profile')
//     // res.status(200).json({ message: 'Profile updated successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to update profile' });
//   }

// }

const editProfile = async (req, res) => {
  try {
    console.log("edit Profile");

    const { fullName, userName, phoneNumber } = req.body;

    await user.User.updateOne({ email: this.userEmail }, { fullName, userName, phone: phoneNumber });

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    console.log("eorroor");

    res.status(500).json({ message: 'Failed to update profile' });
  }
};


const postAddress = async (req, res) => {
  try {
    const {
      recipientName,
      phoneNumber,
      addressLine,
      landmark,
      city,
      state,
      pinCode,
      country,
      isDefault
    } = req.body;
    console.log(recipientName);

    const userId = req.session.userId;
    console.log(userId);
    const newAddress = {
      recipientName,
      phoneNumber,
      addressLine,
      landmark,
      city,
      state,
      pinCode,
      country: country || 'India', // Use default if not provided
      isDefault: isDefault === 'on' // Convert checkbox value to boolean
    };
    const use = await user.User.findOne({ _id: userId })
    console.log(use);


    await user.User.updateOne(
      { _id: userId },
      { $push: { addresses: newAddress } }
    );
    console.log("aaaaaaaaaashsa");
    if (req.params.address == "checkout") {
      return res.redirect('/checkout')

    } else if (req.params.address == "profile") {
      return res.redirect('/profile')

    }




  } catch (error) {

  }
}

// const editAddress = async (req, res) => {
//   const { recipientName,
//     phoneNumber,
//     addressLine,
//     landmark,
//     city,
//     state,
//     pinCode,
//     isDefault
//   } = req.body;

//   const updates = {
//     "addresses.$.recipientName": recipientName,
//     "addresses.$.phoneNumber": phoneNumber,
//     "addresses.$.addressLine": addressLine,
//     "addresses.$.landmark": landmark,
//     "addresses.$.city": city,
//     "addresses.$.state": state,
//     "addresses.$.pinCode": pinCode,
//     "addresses.$.country": "India", // Setting default as 'India' if not provided
//     "addresses.$.isDefault": isDefault === 'on' // Convert checkbox value to boolean
//   };


//   const addressId = req.params.id;

//   const userId = req.session.userId;


//   await user.User.updateOne(
//     { _id: userId, "addresses._id": addressId },
//     { $set: updates }
//   );
//   res.status(200).json({ message: 'Address updated successfully' });
// } catch (error) {
//   console.error(error);
//   res.status(500).json({ message: 'Failed to update address' });
// }



// }

const editAddress = async (req, res) => {
  try {
    const {
      recipientName,
      phoneNumber,
      addressLine,
      landmark,
      city,
      state,
      pinCode,
      isDefault
    } = req.body;

    const addressId = req.params.id; // Address ID to identify which address to edit
    const userId = req.session.userId; // User ID to identify the user

    // Construct the updates object based on provided fields
    const updates = {
      "addresses.$.recipientName": recipientName,
      "addresses.$.phoneNumber": phoneNumber,
      "addresses.$.addressLine": addressLine,
      "addresses.$.landmark": landmark,
      "addresses.$.city": city,
      "addresses.$.state": state,
      "addresses.$.pinCode": pinCode,
      "addresses.$.country": "India", // Setting default as 'India' if not provided
      "addresses.$.isDefault": isDefault === 'on' // Convert checkbox value to boolean
    };

    // Update the specific address in the user's address list
    await user.User.updateOne(
      { _id: userId, "addresses._id": addressId },
      { $set: updates }
    );

    res.status(200).json({ message: 'Address updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update address' });
  }
};



const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    console.log(addressId);
    console.log(req.params.address);

    const userId = req.session.userId;
    console.log("delete ethi");

    await user.User.updateOne(
      { _id: userId },
      { $pull: { addresses: { _id: addressId } } }
    );
    console.log("delete over");
    if (req.params.address == "checkout") {
      return res.redirect('/checkout')

    } else if (req.params.address == "profile") {
      return res.redirect('/profile')

    }



  } catch (error) {

  }

}



module.exports = {
  getIndexPage,
  getHomePage,
  getLoginPage,
  getForgotPage,
  postForgotPass,
  getForgetPasswordOtp,
  forgetPassOtpVerify,
  getChangePassword,
  postChangePassword,
  forgetPassResendOTP,
  postLogin,
  googleLogin,
  getSignupPage,
  postSignup,
  getOTP,
  verifyOtp,
  resendOTP,
  viewProduct,
  getCategoryUser,
  getProfilePage,
  editProfile,
  postAddress,
  editAddress,
  deleteAddress,
  pageNotFound
};
