const express = require('express');
const adminController = require('../controller/adminController');
const categoryController = require('../controller/categoryController');
const productController = require('../controller/productController');
const orderController = require('../controller/orderController');
const couponController = require('../controller/couponController');
const salesController = require('../controller/salesController');

const auth = require('../middlewares/adminAuth');
const router = express.Router();

const multer = require('multer')

const storage = require('../multer/multer');

const upload = multer({ storage: storage });


router.route('/login' || '/')
    .get(auth.isLogged, adminController.getLogin)
    .post(adminController.postLogin)

router.route('/logout')
    .get(auth.adminLogout)

router.route('/index')
    .get(auth.adminAuth, adminController.getIndex)

router.route('/userList')
    .get(auth.adminAuth, adminController.getUserList);

router.get('/userList/:id', auth.adminAuth, adminController.blockUser);

router.route('/categories')
    .get(auth.adminAuth, categoryController.getCategories)
    .post(auth.adminAuth, categoryController.postCategories)

router.get('/categories/:id', auth.adminAuth, categoryController.listOrUnlist);

router.route('/categories/editOffer')
.post(auth.adminAuth, categoryController.editOffer)

router.route('/categories/edit/:id')
    .get(auth.adminAuth, categoryController.getCategoryEdit)
    .post(auth.adminAuth, categoryController.editCategory)

router.route('/categories/delete/:id')
    .get(auth.adminAuth, categoryController.deleteCategory)

router.route('/products')
    .get(auth.adminAuth, productController.getProductPage)


router.route('/products/addProduct')
    .get(auth.adminAuth, productController.getAddProduct)
    .post(auth.adminAuth, upload.array('images', 3), productController.postProduct)

router.route('/products/delete/:id')
    .get( auth.adminAuth, productController.deleteProduct)

router.route('/products/edit/:id')
    .get(auth.adminAuth, productController.getProductEdit)
    .post(auth.adminAuth, upload.array('images', 3), productController.editProduct)

router.route('/orders')
    .get(auth.adminAuth, orderController.getOrders)

router.route('/orders/updateStatus')
    .post(auth.adminAuth, orderController.changeOrderStatus)

router.route('/orders/cancel')
    .post(auth.adminAuth, orderController.orderCancel)

router.route('/coupon')
    .get(auth.adminAuth,couponController.getCouponAdmin)
    .post(auth.adminAuth, couponController.addCoupon)

router.route('/coupon/delete/:couponId')
.get(auth.adminAuth, couponController.deleteCoupon)

router.route('/salesReport')
    .get(auth.adminAuth,salesController.getSalesReport)

router.route("/salesReport/download/excel")
    .get(auth.adminAuth, salesController.downloadSalesReport);

router.route("/salesReport/download/pdf")
    .get(auth.adminAuth, salesController.downloadPdf);

router.route('/')
    .get(auth.adminAuth,salesController.getDashboard)
    .post(auth.adminAuth, couponController.addCoupon)


    router.get('*',adminController.pageNotFoundAdmin)



module.exports = router;
