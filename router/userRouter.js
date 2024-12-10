const express = require("express");
const controller = require("../controller/userController");
const cartController = require("../controller/cartController");
const orderController = require("../controller/orderController");
const wishlistController = require("../controller/wishlistController");
const couponController = require("../controller/couponController");
const passport = require("passport");
const auth = require("../middlewares/userAuth");
const Razorpay = require("razorpay");

const router = express.Router();

router.get("/",auth.isLogged, controller.getIndexPage);

router.route("/home").get(auth.userAuth,controller.getHomePage);

router
  .route("/login")
  .get(auth.isLogged, controller.getLoginPage)
  .post(controller.postLogin);

router
  .route("/forgotPassword")
  .get(auth.isLogged, controller.getForgotPage)
  .post(controller.postForgotPass);

router
  .route("/forgotPasswordOtp")
  .get(auth.isLogged,controller.getForgetPasswordOtp)
  .post(controller.forgetPassOtpVerify);

router
  .route("/changePassword")
  .get(controller.getChangePassword)
  .post(controller.postChangePassword);

router.route("/forgetPassResendOTP").post(controller.forgetPassResendOTP);

router.route("/logout").get(auth.userLogout);

router
  .route("/signup")
  .get(auth.isLogged,controller.getSignupPage)
  .post(controller.postSignup);

router
  .route("/verifyOTP")
  .get(auth.isLogged,controller.getOTP)
  .post(controller.verifyOtp);

router.route("/resendOTP").post(controller.resendOTP);

router
  .route("/auth/google")
  .get(passport.authenticate("google", { scope: ["Profile", "email"] }));

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup" }),
  controller.googleLogin
);

router
  .route("/viewProduct/:id")
  .get( controller.viewProduct);

router
  .route("/profile")
  .get(auth.userAuth, controller.getProfilePage)
  .post(auth.userAuth, controller.editProfile);

router.route("/profile/orders/:orderId").get(auth.userAuth,orderController.viewOrders);

router
  .route("/profile/orders/:orderId/invoice")
  .get(auth.userAuth,orderController.invoiceDownload);

router.route("/addAddress/:address").post(auth.userAuth,controller.postAddress);

router.route("/address/:address/delete/:id").get(auth.userAuth,controller.deleteAddress);

router.route("/address/edit/:id").post(auth.userAuth,controller.editAddress);

router.route("/cart").get(auth.userAuth, cartController.getCartPage);

router.route("/addToCart").post(auth.userAuth,cartController.addToCart);

router.route("/updateQuantity").post(auth.userAuth,cartController.updateQuantity);

router
  .route("/cart/:id")
  .get(auth.userAuth, cartController.deleteFromCart);

router.route("/categories").get(auth.userAuth, controller.getCategoryUser);

router.route("/checkout").get(auth.userAuth, cartController.checkout);

router.route("/razorPay").post(orderController.razorpayPayment);

router.route("/paymentFailed").post(auth.userAuth,orderController.failedPayment);

router.route("/retryPayment").post(auth.userAuth,orderController.retryPayment);

router.route("/retrySuccess").post(auth.userAuth,orderController.retrySuccess);

router.route("/walletTransaction").post(auth.userAuth,orderController.walletTransaction);

router.route("/placeOrder").post(auth.userAuth,orderController.placeOrder);

router
  .route("/orderConfirmation/:orderId")
  .get(auth.userAuth,orderController.orderConfirmationPage);

router.route("/orderCancel/").post(auth.userAuth,orderController.orderCancel);

router.route("/orderReturn/").post(auth.userAuth,orderController.orderReturn);

router
  .route("/wishlist")
  .get(auth.userAuth, wishlistController.getWishlistPage);

router.route("/addToWishlist").post(auth.userAuth,wishlistController.addToWishlist);

router.route("/applyCoupon").post(auth.userAuth,couponController.applyCoupon);

router.route("/removeCoupon").post(auth.userAuth,couponController.removeCoupon);

router.get('*',controller.pageNotFound)



module.exports = router;
