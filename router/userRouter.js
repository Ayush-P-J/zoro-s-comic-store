const express = require('express');
const controller = require('../controller/userController');
const passport = require('passport');

const router = express.Router();

router.get('/user/',controller.getIndexPage);

router.route('/user/home')
.get(controller.getHomePage)

router.route('/user/login')
.get(controller.getLoginPage)
.post(controller.postLogin);

router.route('/user/signup')
.get(controller.getSignupPage)
.post(controller.postSignup);

router.route('/user/verifyOTP')
.get(controller.getOTP)
.post(controller.verfyOtp)

router.route('/user/resendOTP')
.post(controller.resendOTP)

router.route('/user/auth/google')
.get(passport.authenticate('google',{scope:['Profile','email']}))

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    req.session.email = true;
    res.redirect('/user/home');
})



module.exports = router;
