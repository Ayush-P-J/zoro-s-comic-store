const express = require('express');
const controller = require('../controller/userController');
const cartController = require('../controller/cartController');
const orderController = require('../controller/orderController');
const wishlistController = require('../controller/wishlistController');
const passport = require('passport');
const auth = require('../middlewares/userAuth');


const router = express.Router();

router.get('/user/', controller.getIndexPage);

router.route('/user/home')
    .get(controller.getHomePage)

router.route('/user/login')
    .get(auth.isLogged, controller.getLoginPage)
    .post(controller.postLogin);

router.route('/user/forgotPassword')
    .get(auth.isLogged, controller.getForgotPage)
    .post(controller.postForgotPass);

router.route('/user/forgotPasswordOtp')
    .get(controller.getForgetPasswordOtp)
    .post(controller.forgetPassOtpVerify)


router.route('/user/changePassword')
    .get(controller.getChangePassword)
    .post(controller.postChangePassword)

router.route('/user/forgetPassResendOTP')
    .post(controller.forgetPassResendOTP)

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
    .get(passport.authenticate('google', { scope: ['Profile', 'email'] }))

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), controller.googleLogin);

router.route('/user/viewProduct/:id')
    .get(auth.userAuth, controller.viewProduct)

router.route('/user/profile')
    .get(auth.userAuth, controller.getProfilePage)
    .post(controller.editProfile)

router.route('/user/addAddress/:address')
    .post(controller.postAddress)

router.route('/user/address/:address/delete/:id')
    .get(controller.deleteAddress)

router.route('/user/address/edit/:id')
    .post(controller.editAddress)

router.route('/user/cart')
    .get(auth.userAuth, cartController.getCartPage)

router.route('/user/addToCart')
    .post(cartController.addToCart)

router.route('/user/updateQuantity')
    .post(cartController.updateQuantity)


router.route('/user/cart/:id')
    .get(auth.userAuth, cartController.deleteFromCart)

router.route('/user/categories')
    .get(auth.userAuth, controller.getCategoryUser)

router.route('/user/checkout')
    .get(auth.userAuth, cartController.checkout)

router.route('/user/placeOrder')
    .post(orderController.placeOrder)

router.route('/user/orderConfirmation/:orderId')
    .get(orderController.orderConfirmationPage)

router.route('/user/orderCancel/')
    .post(orderController.orderCancel)

router.route('/user/wishlist')
    .get(auth.userAuth, wishlistController.getWishlistPage)


module.exports = router;
