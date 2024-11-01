const { redirect } = require('express/lib/response');
const models = require('../models/adminModels');
const user = require('../models/userModels');
const { log, error } = require('console');
const { use } = require('../router/adminRouter');
const res = require('express/lib/response');
const bcrypt = require("bcrypt")
const mongoose = require("mongoose");



const path = require('path')
const Sharp = require('sharp')

exports.getLogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin/index');

    }
    // console.log("aadmin ethi");
    
    
    res.render('admin/login', { message: '', title: "Login page" });
}

exports.postLogin = async (req, res) => {
    try {
        const EMAIL = req.body.email;
        const PASSWORD = req.body.password;
        // const EMAIL = "admin@gmail.com"
        // console.log("post ethi");

        const adminExist = await models.Admin.findOne({ email: EMAIL });
        if (!adminExist) {
            
            return res.render('admin/login', { message: 'Invalid Email', title: "Login page" });
            
        }
        // const adminVerify = await bcrypt.compare(password,adminExist.password)
        const adminVerify = await bcrypt.compare(PASSWORD, adminExist.password)
        // console.log("post kazhinj");


        if (adminVerify) {
            req.session.Admin = true;
            res.redirect('/admin/index')

        } else {
            return res.render('admin/login', { message: 'Invalid password', title: "Login page" });

        }




    } catch (error) {

        res.status(500).send("Internal server error")
    }
}

exports.getIndex = (req, res) => {
    res.render('admin/index')
}


exports.getUserList = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    try {
        const skip = (page - 1) * limit;
        // const items = await user.User.find().skip(skip).limit(limit);
        const total = await user.User.countDocuments();
        console.log(total);


        const userData = await user.User.find().skip(skip).limit(limit);

        res.render('admin/userList', {
            userData: userData,
            currentPage: page,
            limit:limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.log(err);

    }
}


exports.blockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const isBlock = await user.User.findOne({ _id: userId })

        console.log(isBlock.isBlocked);

        if (isBlock.isBlocked === true) {
            await user.User.updateOne({ _id: userId }, { $set: { isBlocked: false } });
            // console.log(isBlocked);
            console.log("UNBLOCKED");
            res.redirect('/admin/userList');
        } else {
            await user.User.updateOne({ _id: userId }, { $set: { isBlocked: true } });
            // console.log(isBlocked);
            console.log("BLOCKED");
            res.redirect('/admin/userList');

        }

    } catch (error) {
        res.status(500).send("Internal server error");

    }

}


exports.getCategories = async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    try {
        const skip = (page - 1) * limit;
        // const items = await user.User.find().skip(skip).limit(limit);
        const total = await models.Category.countDocuments();
        // console.log(total);

        const categories = await models.Category.find().skip(skip).limit(limit);
        // console.log(categories)
        res.render('admin/category', { categories: categories, 
            error: "",
            currentPage: page,
            limit:limit,
            totalPages: Math.ceil(total / limit),
         });
        
    } catch (error) {
        console.log(error);
        
    }

    
}

exports.postCategories = async (req, res) => {
    try {
        console.log("haiiiiiiiiii");
        
        const category = req.body.category;
        const description = req.body.description;
        const categories = await models.Category.find()


        const isExist = await models.Category.findOne({categoryName:category})

        if (isExist) {
            return res.render('admin/category', { categories: categories, error: "This category is already exsts" });

        }

        const newCategory = new models.Category({
            categoryName: category,
            description: description
        });
        // console.log(category);


        await newCategory.save();
        res.redirect('/admin/categories')

    } catch (error) {
        console.error(error);


    }
}

exports.listOrUnlist = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await models.Category.findOne({ _id: categoryId });

        if (category.status === true) {
            await models.Category.updateOne({ _id: categoryId }, { $set: { status: false } });
            // console.log(isBlocked);
            console.log("UNBLOCKED");
            res.redirect('/admin/categories');
        } else {
            await models.Category.updateOne({ _id: categoryId }, { $set: { status: true } });
            // console.log(isBlocked);
            console.log("BLOCKED");
            res.redirect('/admin/categories');

        }


    } catch (error) {
        console.log(error);

    }

}

exports.getCategoryEdit = async (req, res) => {
    const categoryId = req.params.id;

    const category = await models.Category.findOne({ _id: categoryId });

    res.render('admin/editCategory',{error:"",category})
}

exports.editCategory = async (req, res) => {

    const {category, description} = req.body
    // const description = req.body.description;
    try {
        await models.Category.updateOne({ _id: req.params.id }, 
            { categoryName: category, description });
        res.redirect('/admin/categories');
    }
    catch (err) {
        console.error(err)

    }


}


exports.deleteCategory = async (req, res) =>{
    const categoryId = req.params.id;
    try{
        await models.Category.updateOne({_id:categoryId},{$set:{isDeleted:true}});
        res.redirect('/admin/categories');


    }  catch (error){

    }  
    
}

exports.getProductPage = async (req, res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    try {
        const skip = (page - 1) * limit;

        const total = await models.Product.countDocuments();
        // console.log(total);

        const categories = await models.Category.find().skip(skip).limit(limit);


        const products = await models.Product.find().populate('category').skip(skip).limit(limit);
        // console.log(categories)
        // return res.json(products)
        res.render('admin/products', { products: products,
             categories: categories,
              error: "" ,
              currentPage: page,
              limit:limit,
              totalPages: Math.ceil(total / limit),
            })
    } catch (error) {
        
    }

}

exports.postProduct = async (req ,res)=>{
    const {
        productName,
        description,
        stock,
        category,
        size,
        regularPrice,
        salePrice,
        status,
        review,
        images
      }
       = req.body;
       
    //    const FullProductName = productName + " (" + size + ")" need to add the product name as name + size
       const products = await models.Product.find().populate('category')

    try {
        const isExist = await models.Product.findOne({productName:productName})

    if(isExist){
        return res.render('admin/products', { 
            products: products,
             error: "This product already exist in the database" 
            });

    }
console.log(category);

    // Array to store image filenames
    const uploadImages = [];

    // Handle file uploads using multer
    if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
            const originalImagePath = req.files[i].path;
            const resizedFilename = Date.now() + req.files[i].filename;
            const resizedImagesPath = path.join('public', 'images', resizedFilename);

            const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
            if (!supportedFormats.includes(req.files[i].mimetype)) {
                return res.status(400).json({ error: 'Unsupported image format' });
            }

            // Resize the image using Sharp
            try {
                await Sharp(originalImagePath)
                    .resize({ width: 440, height: 440 })
                    .toFile(resizedImagesPath);
            } catch (sharpError) {
                console.log('Error processing image with Sharp:', sharpError);
                return res.status(500).json({ error: 'Error processing image' });
            }

            // Push the resized filename to the array
            uploadImages.push(resizedFilename);
        }
    }

    // Find category by name
    const categoryData = await models.Category.findOne({ _id: category });
    if (!categoryData) {
        return res.status(404).json({ error: 'Category not found' });
    }

    

    const newProduct = new models.Product({
        productName: productName,
        description: description,
        stock: stock,
        category: category,
        size: size,
        regularPrice: regularPrice,
        salePrice: salePrice,
        status: status,
        review: review,
        images: uploadImages
    });
    

    await newProduct.save();
    res.redirect('/admin/products')
    } catch (error) {
        console.log(error)
    }
    
    

}

exports.getAddProduct = async (req, res)=>{
console.log("haiiii");

    const categories = await models.Category.find()
    const products = await models.Product.find().populate('category')
    // console.log(products);
    
    res.render('admin/addProduct',{products:products,categories:categories, error:""})
}

exports.deleteProduct = async (req, res) =>{
    try{
        const productId = req.params.id;
        console.log(productId);
        const isListed = models.Product.findOne({_id:productId})
        if(isListed.isListed){
            await models.Product.updateOne({_id:productId},{$set:{isListed:false}});
            res.redirect('/admin/products');
            
        }else{
            await models.Product.updateOne({_id:productId},{$set:{isListed:true}});
            res.redirect('/admin/products');

        }
        

    }  catch (error){
        console.log(error)

    }
    
}


exports.getProductEdit = async (req, res) => {
    const productId = req.params.id;
    
    console.log(productId);

    
    
    
    try {
        // Convert productId to ObjectId if valid
        const product = await models.Product.findOne({ _id: new mongoose.Types.ObjectId(productId) });
          const categories = await models.Category.find()
        
        if (product) {
            res.render('admin/editProduct',{error:"",product,categories})
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        // Handle the case where the productId is not a valid ObjectId
        res.status(400).json({ message: 'Invalid product ID format', error: error.message });
    }
}

exports.editProduct = async (req, res) => {
    

    console.log(req.body.formData)

    try {
        // Collect updates from req.body
        const {
            productName,
            description,
            stock,
            category,
            size,
            regularPrice,
            salePrice,
            status,
            review,
            images
          }
           = req.body;
        console.log(req.body);

        // Array to store image filenames
    const uploadImages = [];

    // Handle file uploads using multer
    if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
            const originalImagePath = req.files[i].path;
            const resizedFilename = Date.now() + req.files[i].filename;
            const resizedImagesPath = path.join('public', 'images', resizedFilename);

            const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
            if (!supportedFormats.includes(req.files[i].mimetype)) {
                return res.status(400).json({ error: 'Unsupported image format' });
            }

            // Resize the image using Sharp
            try {
                await Sharp(originalImagePath)
                    .resize({ width: 440, height: 440 })
                    .toFile(resizedImagesPath);
            } catch (sharpError) {
                console.log('Error processing image with Sharp:', sharpError);
                return res.status(500).json({ error: 'Error processing image' });
            }

            // Push the resized filename to the array
            uploadImages.push(resizedFilename);
        }
    }
        

        const updatedProduct = await models.Product.updateOne({ _id: req.params.id }, {
            productName: productName,
            description: description,
            stock: stock,
            category: category,
            size: size,
            regularPrice: regularPrice,
            salePrice: salePrice,
            status: status,
            review: review,
            images:uploadImages,
        });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).redirect('/admin/products');
    } catch (error) {
        res.status(400).json({ message: 'Error updating product', error: error.message });
    }
};

