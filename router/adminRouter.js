const express = require('express');
const controller = require('../controller/adminController');
const auth = require('../middlewares/adminAuth');
const router = express.Router();

const multer = require('multer')

const storage = require('../multer/multer');

const upload = multer({storage:storage});


router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
});
  

router.route('/login')
.get(auth.isLogged,controller.getLogin)
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
.get(auth.adminAuth,controller.getCategoryEdit)
.post(controller.editCategory)

router.route('/categories/delete/:id')
.get(auth.adminAuth,controller.deleteCategory)

router.route('/products')
.get(auth.adminAuth,controller.getProductPage)

router.route('/products/addProduct')
.get(auth.adminAuth,controller.getAddProduct)
.post(upload.array('images',3),controller.postProduct)

router.route('/products/delete/:id')
.get((req,res,next)=>{
    console.log("hhhh");
    next();
},auth.adminAuth,controller.deleteProduct)

router.route('/products/edit/:id')
.get(auth.adminAuth,controller.getProductEdit)
.post(upload.array('images',3),controller.editProduct)





module.exports = router;
