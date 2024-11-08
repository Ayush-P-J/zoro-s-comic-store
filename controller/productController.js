const { redirect } = require('express/lib/response');
const models = require('../models/adminModels');
const user = require('../models/userModels');
const path = require('path')
const { log, error } = require('console');
const { use } = require('../router/adminRouter');
const res = require('express/lib/response');
const bcrypt = require("bcrypt")
const mongoose = require("mongoose");
const nocache = require('nocache');
const Sharp = require('sharp')


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
    console.log(products);
    
    res.render('admin/addProduct',{products:products,categories:categories, error:""})
}

exports.deleteProduct = async (req, res) =>{
    try{
        const productId = req.params.id;
        console.log(productId);
        const isListed = await models.Product.findOne({_id:productId})
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

    console.log("haiiillkkkk");



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
                if (req.files[i]) {
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
                }

                // Push the resized filename to the array
                uploadImages.push(resizedFilename);
            }
        }


        const updateFields = {};
        if (productName) updateFields.productName = productName;
        if (description) updateFields.description = description;
        if (stock) updateFields.stock = stock;
        if (category) updateFields.category = category;
        if (size) updateFields.size = size;
        if (regularPrice) updateFields.regularPrice = regularPrice;
        if (salePrice) updateFields.salePrice = salePrice;
        if (status) updateFields.status = status;
        if (review) updateFields.review = review;
        if (uploadImages) updateFields.images = uploadImages;

        // Perform the update with only the provided fields
        const updatedProduct = await models.Product.findByIdAndUpdate(
            { _id: req.params.id },
            updateFields,
            { new: true } // Returns the updated document
        );

        console.log(uploadImages);

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).redirect('/admin/products');
    } catch (error) {
        res.status(400).json({ message: 'Error updating product', error: error.message });
    }
};