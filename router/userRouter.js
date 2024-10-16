const express = require('express');
const controller = require('../controller/userController');

const router = express.Router();

router.get('/',controller.getIndexPage);

router.route('/home')
.get(controller.getHomePage)

router.route('/login')
.get(controller.getLoginPage)
.post(controller.postLogin);

router.route('/signup')
.get(controller.getSignupPage)
.post(controller.postSignup);

router.route('/verifyOTP')
.get(controller.getOTP)
.post(controller.verfyOtp)





module.exports = router;
