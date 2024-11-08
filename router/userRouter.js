const express = require('express');
const controller = require('../controller/userController');
const cartController = require('../controller/cartController');
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
.get(auth.userAuth,controller.viewProduct)

router.route('/user/profile')
.get(auth.userAuth,controller.getProfilePage)
.post(controller.editProfile)

router.route('/user/addAddress')
.post(controller.postAddress)


router.route('/user/cart')
.get(auth.userAuth,cartController.getCartPage)

router.route('/user/addToCart')
.post(cartController.addToCart)

router.route('/user/updateQuantity')
.post(cartController.updateQuantity)


router.route('/user/cart/:id')
.get(auth.userAuth,cartController.deleteFromCart)

router.route('/user/categories')
.get(controller.getCategoryUser)



module.exports = router;
