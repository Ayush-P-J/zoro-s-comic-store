const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")
const models = require('../models/userModels');
const admin = require('../models/adminModels');

const env = require("dotenv").config()



exports.getIndexPage = async (req, res) => {
  if (req.session.email) {
    return res.redirect('/user/home');

  }
  const products = await admin.Product.find({isListed:true})

  res.render('user/index',{products});

}
exports.getHomePage = async(req, res) => {
  const products = await admin.Product.find({isListed:true}).populate('category')

  if (!req.session.email) {
    return res.redirect('/user/login');

  }
  res.render('user/home',{products});

}



//Get user login page 

exports.getLoginPage = async (req, res) => {

  if (req.session.email) {
    return res.redirect('/user/home');

  } else if (req.session.isBlocked){

    return res.render('user/login', { message: 'This Email is blocked by the admin', title: "Login page" });
  }
  return res.render('user/login', { message: '', title: "Login page" });

};


exports.postLogin = async (req, res) => {
  try {
    // const { USERNAME, FULLNAME, PASSWORD } = req.body;
    const EMAIL = req.body.email;
    const PASSWORD = req.body.password
    console.log(EMAIL);
    
    // const PASSWORD = passwordHash;

    const userDetails = await models.User.findOne({ email: EMAIL });


    if(userDetails.isBlocked === true){
      req.session.isBlocked = true;
      return res.redirect('/user/login')
    }

   

    
    if (!userDetails) {
      return res.render('user/login', { message: 'Invalid Email', title: "Login page" });


    }
    
    const userVerify =  bcrypt.compare(PASSWORD, userDetails.password)
    if (userVerify) {
      req.session.email = EMAIL;
      // req.session.fullName = FULLNAME;

      res.redirect('/user/home');
    } else {
      return res.render('user/login', { message: ' Incorrect password', title: "Login page" });
    }
  } catch (error) {

    res.status(500).send("Internal server error")
  }

};

exports.googleLogin = async (req,res)=>{
  const EMAIL = req.user.email
  console.log(EMAIL);
  
  const userDetails = await models.User.findOne({ email: EMAIL });

  if(userDetails.isBlocked){
    req.session.isBlocked = true;
      return res.redirect('/user/login')
      // return res.render('user/login', { message: 'This Email is blocked by the admin', title: "Login page" });
      
  }
  req.session.email = true;
  res.redirect('/user/home');
}







exports.getSignupPage = (req, res) => {
  res.render('user/signup', { message: "" });

};





exports.postSignup = async (req, res) => {

  const FULLNAME = req.body.fullName;
  const USERNAME = req.body.userName;
  const PHONE = req.body.phone;
  const EMAIL = req.body.email;
  const PASSWORD = req.body.password;
  // const CONFIRMPASS = req.body.confirmPass;


  try {
    const existingUser = await models.User.findOne({ email: EMAIL });


    if (existingUser) {

      return res.render('user/signup', { message: "This email already has an account " });
    }

    const otp = generateOtp()

    const emailSent = await sendVerificationEmail(EMAIL, otp);

    if (!emailSent) {
      return res.json("email-error")
    }

    req.session.userOtp = otp;
    req.session.otpExpires = Date.now() + 30 * 1000;

    req.session.userData = { FULLNAME, USERNAME, PHONE, EMAIL, PASSWORD };

    res.redirect("/user/verifyOTP")
    console.log("OTP send", otp)



  } catch (error) {
    console.log("Error for OTP creating", error)
    res.status(500).send("Internal server error")
  }

};

exports.getOTP = (req, res) => {
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



exports.verifyOtp = async (req, res) => {
  try {
    const OTP = req.body.otp; // Ensure lowercase to match frontend
    console.log('AAAA');
    

    req.session.userOtp = Date.now() > req.session.otpExpires ? null : req.session.userOtp;
    const user = req.session.userData;

    if (OTP === req.session.userOtp) {
      const passwordHash = await securePassword(user.PASSWORD);

      const newUser = new models.User({
        fullName: user.FULLNAME,
        userName: user.USERNAME,
        phone: user.PHONE,
        email: user.EMAIL,
        password: passwordHash
      });

      await newUser.save();

      req.session.user = newUser._id;
      req.session.successMessage = "User registered successfully!";
      req.session.userOtp = null;
      req.session.userData = null;

      return res.status(200).json({
        success: true,
        message: "Email verified",
        redirectUrl: "/user/login"
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



exports.resendOTP = async (req, res) => {
  try {

    console.log('email');

    const { EMAIL } = req.session.userData
    const email = EMAIL
    if (!email) {
      return res.status(400).json({ success: false, message: "Email not found in session" })

    }
    console.log(EMAIL);



    const otp = generateOtp()
    req.session.userOtp = otp

    const emailSend = await sendVerificationEmail(email, otp)
    if (emailSend) {
      console.log("Resend otp", otp);
      res.status(200).json({ success: true, message: "OTP Resend Successfully" })

    } else {
      res.status(500).json({ success: false, message: "Failed to OTP resend, Please try again" })
    }

  } catch (error) {
    console.log("Error for resend OTP", error);
    res.status(500)

  }
}

exports.viewProduct = async (req,res)=>{
  const productId = req.params.id;

  
  const product = await admin.Product.findOne({ _id: productId });

  const products = await admin.Product.find({
    category:product.category,
    isListed:true,
    _id:{$ne:productId}
  }).limit(3)

  res.render('user/viewProduct', {product,products})
}
