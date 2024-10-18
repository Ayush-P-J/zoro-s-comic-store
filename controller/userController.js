const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")
const models = require('../models/userModels');
const env = require("dotenv").config()



exports.getIndexPage = (req, res)=>{
    if(req.session.email){
        return res.redirect('/user/home');
       
     }
    res.render('user/index');

}
exports.getHomePage = (req, res)=>{
    if(!req.session.email){
        return res.redirect('/user/login');
       
     }
    res.render('user/home');

}



//Get user login page 

exports.getLoginPage = (req,res)=>{
    if(req.session.email){
      return res.redirect('/user/home');
     
   }
    res.render('user/login',{ message: '', title:"Login page" });
  
};


exports.postLogin = async (req,res)=>{
    try{
      // const { USERNAME, FULLNAME, PASSWORD } = req.body;
    const EMAIL = req.body.email;
    const PASSWORD = req.body.password
    // const PASSWORD = passwordHash;
    
    const userDetails = await models.User.findOne({email:EMAIL});
    if(!userDetails){
      return  res.render('user/login',{ message: 'Invalid Email', title:"Login page" });


    }
    const userVerify = await bcrypt.compare(PASSWORD,userDetails.password)
    if(userVerify){
        req.session.email = EMAIL;
        // req.session.fullName = FULLNAME;
  
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
  
        res.redirect('/user/home');
      } else{
        return  res.render('user/login',{ message: ' Incorrect password', title:"Login page" });
      } 
    } catch (error) {
        
        res.status(500).send("Internal server error")
      }

    };
      
      
    
  
  


exports.getSignupPage = (req, res)=>{
    res.render('user/signup',{message:""});
  
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

      res.render('user/signup',{message:"This email already has an account "});
    }

    const otp = generateOtp()

    const emailSent = await sendVerificationEmail(EMAIL, otp);

    if (!emailSent) {
      return res.json("email-error")
    }

    req.session.userOtp = otp;
    req.session.userData = { FULLNAME, USERNAME, PHONE, EMAIL, PASSWORD };

    res.redirect("/user/verifyOTP")
    console.log("OTP send", otp)



  } catch (error) {
    console.log("Error for OTP creating", error)
    res.status(500).send("Internal server error")
  }

};
      
exports.getOTP = (req,res) =>{
        res.render('user/otpPage',{errorMessage:""});
}

const generateOtp = ()=>{
        return Math.floor(100000 + Math.random()* 900000).toString()  
}

const securePassword = async (password)=>{
  try {

      const passwordHash = await bcrypt.hash(password,10)

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



exports.verfyOtp = async (req, res) => {
  try {
      const otp  = req.body.otp;


      const user = req.session.userData; // Make sure userData is set in the session

      // Verify OTP
      if (otp === req.session.userOtp) {

          const passwordHash = await securePassword(user.PASSWORD);

          const newUser = new models.User({
            fullName:user.FULLNAME,
            userName:user.USERNAME,
            phone:user.PHONE,
            email:user.EMAIL,
            password:passwordHash
          });

          await newUser.save();

          req.session.user = newUser._id; //some thing to do with this
          req.session.successMessage = "User registered successfully!";

              req.session.userOtp = null;
              req.session.userData = null;

          return res.redirect("/user/login");


      } else {
          return res.render('user/otpPage',{errorMessage:"Invalid OTP"});
      }

  } catch (error) {
      console.error("Error verifying OTP", error);
      return res.status(500).json({ success: false, message: "An error occurred" });
  }
};


exports.resendOTP = async (req,res)=>{
  try {
    
    console.log('email');

      const {EMAIL} = req.session.userData
      const email = EMAIL
      if(!email){
          return res.status(400).json({success:false, message:"Email not found in session"})

      }
      console.log(EMAIL);
      
      

      const otp = generateOtp()
          req.session.userOtp = otp

          const emailSend = await sendVerificationEmail(email,otp)
          if(emailSend){
              console.log("Resend otp", otp);
              res.status(200).json({success:true, message:"OTP Resend Successfully"})
              
          }else{
              res.status(500).json({success:false, message:"Failed to OTP resend, Please try again"})
          }
      
  } catch (error) {
      console.log("Error for resend OTP",error);
      res.status(500).json({success:false, message:"Internal server error"})
      
  }
}
