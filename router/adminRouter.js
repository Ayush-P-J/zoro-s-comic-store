const express = require('express');
const controller = require('../controller/adminController');
const auth = require('../middlewares/adminAuth');
const router = express.Router();

router.route('/login')
.get(controller.getLogin)
.post(controller.postLogin)

router.route('/logout')
.get(auth.adminLogout)

router.route('/index')
.get(auth.adminAuth,controller.getIndex)

router.route('/userList')
.get(auth.adminAuth,controller.getUserList);

router.get('/userList/:id',auth.adminAuth,controller.blockUser);

router.route('/categories')
.get(auth.adminAuth,controller.getCategories)
.post(controller.postCategories)

router.get('/categories/:id',auth.adminAuth,controller.listOrUnlist);

router.route('/categories/edit/:id')
.get(auth.adminAuth,controller.getEdit)
.post(controller.editCategory)

router.route('/categories/delete/:id')
.get(auth.adminAuth,controller.deleteCategory)

router.route('/products')
.get(controller.getProductPage)
.post(controller.postProducts)





module.exports = router;
