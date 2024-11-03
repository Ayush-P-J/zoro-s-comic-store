const express = require('express');
const controller = require('../controller/userController');
const passport = require('passport');
const auth = require('../middlewares/userAuth');


const router = express.Router();

router.get('/user/',controller.getIndexPage);

router.route('/user/home')
.get(controller.getHomePage)

router.route('/user/login')
.get(auth.isLogged,controller.getLoginPage)
.post(controller.postLogin);

router.route('/user/logout')
.get(auth.userLogout)

router.route('/user/signup')
.get(controller.getSignupPage)
.post(controller.postSignup);

router.route('/user/verifyOTP')
.get(controller.getOTP)
.post(controller.verifyOtp)

router.route('/user/resendOTP')
.post(controller.resendOTP)

router.route('/user/auth/google')
.get(passport.authenticate('google',{scope:['Profile','email']}))

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),controller.googleLogin);

router.route('/user/viewProduct/:id')
.get(controller.viewProduct)



module.exports = router;
