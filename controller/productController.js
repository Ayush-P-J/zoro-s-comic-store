const { redirect } = require("express/lib/response");
const models = require("../models/adminModels");
const user = require("../models/userModels");
const fs = require("fs");
const path = require("path");
const { log, error } = require("console");
const { use } = require("../router/adminRouter");
const res = require("express/lib/response");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const nocache = require("nocache");
const Sharp = require("sharp");

const getProductPage = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  try {
    const skip = (page - 1) * limit;

    const total = await models.Product.countDocuments();
    // console.log(total);

    const categories = await models.Category.find().skip(skip).limit(limit);

    const products = await models.Product.find()
      .populate("category")
      .skip(skip)
      .limit(limit);
    // console.log(categories)
    // return res.json(products)
    res.render("admin/products", {
      products: products,
      categories: categories,
      error: "",
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {}
};

// const postProduct = async (req, res) => {
//     const {
//         productName,
//         description,
//         stock,
//         category,
//         size,
//         regularPrice,
//         salePrice,
//         status,
//         review,
//         images
//     }
//         = req.body;

//     //    const FullProductName = productName + " (" + size + ")" need to add the product name as name + size
//     const products = await models.Product.find().populate('category')

//     try {
//         const isExist = await models.Product.findOne({ productName: productName })

//         if (isExist) {
//             return res.render('admin/products', {
//                 products: products,
//                 error: "This product already exist in the database"
//             });

//         }
//         console.log(category);

//         // Array to store image filenames
//         const uploadImages = [];

//         // Handle file uploads using multer
//         if (req.files && req.files.length > 0) {
//             for (let i = 0; i < req.files.length; i++) {
//                 const originalImagePath = req.files[i].path;
//                 const resizedFilename = Date.now() + req.files[i].filename;
//                 const resizedImagesPath = path.join('public', 'images', resizedFilename);

//                 const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
//                 if (!supportedFormats.includes(req.files[i].mimetype)) {
//                     return res.status(400).json({ error: 'Unsupported image format' });
//                 }

//                 // Resize the image using Sharp
//                 try {
//                     await Sharp(originalImagePath)
//                         .resize({ width: 440, height: 440 })
//                         .toFile(resizedImagesPath);
//                 } catch (sharpError) {
//                     console.log('Error processing image with Sharp:', sharpError);
//                     return res.status(500).json({ error: 'Error processing image' });
//                 }

//                 // Push the resized filename to the array
//                 uploadImages.push(resizedFilename);
//             }
//         }

//         // Find category by name
//         const categoryData = await models.Category.findOne({ _id: category });
//         if (!categoryData) {
//             return res.status(404).json({ error: 'Category not found' });
//         }

//         const newProduct = new models.Product({
//             productName: productName,
//             description: description,
//             stock: stock,
//             category: category,
//             size: size,
//             regularPrice: regularPrice,
//             salePrice: salePrice,
//             status: status,
//             review: review,
//             images: uploadImages
//         });

//         await newProduct.save();
//         res.redirect('/admin/products')
//     } catch (error) {
//         console.log(error)
//     }

// }

async function processImages(files) {
  const uploadImages = [];
  const supportedFormats = ["image/jpeg", "image/png", "image/webp"];

  for (const file of files) {
    const originalImagePath = file.path;
    const resizedFilename = Date.now() + file.filename;
    const resizedImagesPath = path.join("public", "images", resizedFilename);

    // Check if the file format is supported
    if (!supportedFormats.includes(file.mimetype)) {
      throw new Error("Unsupported image format");
    }

    // Resize the image using Sharp
    try {
      await Sharp(originalImagePath)
        .resize({ width: 440, height: 440 })
        .toFile(resizedImagesPath);

      // Push the resized filename to the array
      uploadImages.push(resizedFilename);
    } catch (error) {
      throw new Error("Error processing image with Sharp");
    }
  }

  return uploadImages;
}

const postProduct = async (req, res) => {
  const {
    productName,
    description,
    stock,
    category,
    size,
    regularPrice,
    offer,
    status,
    review,
  } = req.body;

  const products = await models.Product.find().populate("category");

  try {
    const isExist = await models.Product.findOne({ productName: productName });

    if (isExist) {
      return res.render("admin/products", {
        products: products,
        error: "This product already exists in the database",
      });
    }

    // Process images using the utility function
    let uploadImages = [];
    if (req.files && req.files.length > 0) {
      try {
        uploadImages = await processImages(req.files);
      } catch (error) {
        console.log(error.message);
        return res.status(400).json({ error: error.message });
      }
    }

    // Find category by ID
    const categoryData = await models.Category.findOne({ _id: category });
    if (!categoryData) {
      return res.status(404).json({ error: "Category not found" });
    }

    const offerPercent =
      offer > products.category.offer ? offer : products.category.offer;

    const salePrice = regularPrice - (regularPrice * offerPercent) / 100;

    // Create a new product
    const newProduct = new models.Product({
      productName: `${productName}`, // Include size in product name
      description: description,
      stock: stock,
      category: category,
      size: size,
      offer: offer,
      regularPrice: regularPrice,
      salePrice: salePrice,
      status: status,
      review: review,
      images: uploadImages,
    });

    await newProduct.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getAddProduct = async (req, res) => {
  console.log("haiiii");

  const categories = await models.Category.find();
  const products = await models.Product.find().populate("category");
  console.log(products);

  return res.render("admin/addProduct", {
    products: products,
    categories: categories,
    error: "",
  });
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(productId);
    const isListed = await models.Product.findOne({ _id: productId });
    if (isListed.isListed) {
      await models.Product.updateOne(
        { _id: productId },
        { $set: { isListed: false } }
      );
      res.redirect("/admin/products");
    } else {
      await models.Product.updateOne(
        { _id: productId },
        { $set: { isListed: true } }
      );
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};

const getProductEdit = async (req, res) => {
  const productId = req.params.id;

  console.log(productId);

  try {
    // Convert productId to ObjectId if valid
    const product = await models.Product.findOne({
      _id: new mongoose.Types.ObjectId(productId),
    });
    const categories = await models.Category.find();

    if (product) {
      res.render("admin/editProduct", { error: "", product, categories });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    // Handle the case where the productId is not a valid ObjectId
    res
      .status(400)
      .json({ message: "Invalid product ID format", error: error.message });
  }
};

async function processImagesForEdit(files) {
  const uploadImages = [];
  const supportedFormats = ["image/jpeg", "image/png", "image/webp"];

  for (const file of files) {
    const originalImagePath = file.path;
    const resizedFilename = Date.now() + "_" + file.filename;
    const resizedImagesPath = path.join("public", "images", resizedFilename);

    // Check if the file format is supported
    if (!supportedFormats.includes(file.mimetype)) {
      throw new Error("Unsupported image format");
    }

    // Resize the image using Sharp
    try {
      await Sharp(originalImagePath)
        .resize({ width: 440, height: 440 })
        .toFile(resizedImagesPath);

      // Push the resized filename to the array
      uploadImages.push(resizedFilename);
    } catch (error) {
      throw new Error("Error processing image with Sharp");
    }
  }

  return uploadImages;
}

const editProduct = async (req, res) => {
  const productId = req.params.id;

  const {
    productName,
    description,
    stock,
    category,
    size,
    regularPrice,
    offer,
    status,
    review,
  } = req.body;

  try {
    // Find the product by ID
    const product = await models.Product.findById(productId).populate(
      "category"
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Process new images if provided
    let newImages = product.images; // Default to existing images
    if (req.files && req.files.length > 0) {
      try {
        // Delete old images
        product.images.forEach((image) => {
          const imagePath = path.join("public", "images", image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath); // Remove old image file
          }
        });

        // Process new images
        newImages = await processImagesForEdit(req.files);
      } catch (error) {
        console.log(error.message);
        return res.status(400).json({ error: error.message });
      }
    }
    const offerPercent =
      offer > product.category.offer ? offer : product.category.offer;
    const salePrice = regularPrice - (regularPrice * offerPercent) / 100;

    // Update the product fields
    product.productName = `${productName}`;
    product.description = description;
    product.stock = stock;
    product.category = category;
    product.size = size;
    product.offer = offer;
    product.regularPrice = regularPrice;
    product.salePrice = salePrice;
    product.status = status;
    product.review = review;
    product.images = newImages;

    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// const editProduct = async (req, res) => {
//   console.log("edit Product");

//   try {
//     // Collect updates from req.body
//     const {
//       productName,
//       description,
//       stock,
//       category,
//       size,
//       regularPrice,
//       salePrice,
//       status,
//       review,
//       images,
//     } = req.body;
//     console.log(req.body);

//     // Array to store image filenames
//     const uploadImages = [];

//     // Handle file uploads using multer
//     if (req.files && req.files.length > 0) {
//       for (let i = 0; i < req.files.length; i++) {
//         const originalImagePath = req.files[i].path;
//         const resizedFilename = Date.now() + req.files[i].filename;
//         const resizedImagesPath = path.join(
//           "public",
//           "images",
//           resizedFilename
//         );

//         const supportedFormats = ["image/jpeg", "image/png", "image/webp"];
//         if (req.files[i]) {
//           if (!supportedFormats.includes(req.files[i].mimetype)) {
//             return res.status(400).json({ error: "Unsupported image format" });
//           }

//           // Resize the image using Sharp
//           try {
//             await Sharp(originalImagePath)
//               .resize({ width: 440, height: 440 })
//               .toFile(resizedImagesPath);
//           } catch (sharpError) {
//             console.log("Error processing image with Sharp:", sharpError);
//             return res.status(500).json({ error: "Error processing image" });
//           }
//         }

//         // Push the resized filename to the array
//         uploadImages.push(resizedFilename);
//       }
//     }

//     const updateFields = {};
//     if (productName) updateFields.productName = productName;
//     if (description) updateFields.description = description;
//     if (stock) updateFields.stock = stock;
//     if (category) updateFields.category = category;
//     if (size) updateFields.size = size;
//     if (regularPrice) updateFields.regularPrice = regularPrice;
//     if (salePrice) updateFields.salePrice = salePrice;
//     if (status) updateFields.status = status;
//     if (review) updateFields.review = review;
//     if (uploadImages) updateFields.images = uploadImages;

//     // Perform the update with only the provided fields
//     const updatedProduct = await models.Product.findByIdAndUpdate(
//       { _id: req.params.id },
//       updateFields,
//       { new: true } // Returns the updated document
//     );

//     console.log(uploadImages);

//     if (!updatedProduct) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.status(200).redirect("/admin/products");
//   } catch (error) {
//     res
//       .status(400)
//       .json({ message: "Error updating product", error: error.message });
//   }
// };

// const editProduct = async (req, res) => {
//     try {
//         const {
//             productName,
//             description,
//             stock,
//             category,
//             size,
//             regularPrice,
//             salePrice,
//             status,
//             review
//         } = req.body;

//         // console.log(req.body);

//         // Handle file uploads using multer
//         const updatedImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];

//         if (req.files && req.files.length > 0) {
//             const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
//             for (let i = 0; i < req.files.length; i++) {
//                 const originalImagePath = req.files[i].path;
//                 const resizedFilename = Date.now() + req.files[i].filename;
//                 const resizedImagesPath = path.join('public', 'images', resizedFilename);

//                 if (!supportedFormats.includes(req.files[i].mimetype)) {
//                     return res.status(400).json({ error: 'Unsupported image format' });
//                 }

//                 // Resize the image using Sharp
//                 try {
//                     await Sharp(originalImagePath)
//                         .resize({ width: 440, height: 440 })
//                         .toFile(resizedImagesPath);

//                     // Add resized image to updatedImages
//                     updatedImages.push(resizedFilename);
//                 } catch (sharpError) {
//                     console.log('Error processing image with Sharp:', sharpError);
//                     return res.status(500).json({ error: 'Error processing image' });
//                 }
//             }
//         }

//         const updateFields = {
//             ...(productName && { productName }),
//             ...(description && { description }),
//             ...(stock && { stock }),
//             ...(category && { category }),
//             ...(size && { size }),
//             ...(regularPrice && { regularPrice }),
//             ...(salePrice && { salePrice }),
//             ...(status && { status }),
//             ...(review && { review }),
//             images: updatedImages, // Update the images array
//         };

//         const updatedProduct = await models.Product.findByIdAndUpdate(
//             req.params.id,
//             { $set: updateFields },
//             { new: true }
//         );

//         console.log("images [ "+updatedImages+" ]");

//         if (!updatedProduct) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         res.status(200).redirect('/admin/products');
//     } catch (error) {
//         res.status(400).json({ message: 'Error updating product', error: error.message });
//     }
// };

module.exports = {
  getProductPage,
  postProduct,
  postProduct,
  getAddProduct,
  deleteProduct,
  getProductEdit,
  editProduct,
  editProduct,
  editProduct,
};
