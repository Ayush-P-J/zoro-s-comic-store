const { redirect } = require('express/lib/response');
const models = require('../models/adminModels');
const user = require('../models/userModels');
const { log, error } = require('console');
const { use } = require('../router/adminRouter');
const res = require('express/lib/response');

exports.getLogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin/index');

    }
    console.log("aadmin ethi");
    
    
    res.render('admin/login', { message: '', title: "Login page" });
}

exports.postLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        // const EMAIL = "admin@gmail.com"
        console.log("post ethi");

        const adminExist = models.Admin.findOne({ email: email });
        if (!adminExist) {

            return res.render('admin/login', { message: 'Invalid Email', title: "Login page" });

        }
        // const adminVerify = await bcrypt.compare(password,adminExist.password)
        const adminVerify = models.Admin.findOne({ password: password });


        if (adminVerify) {
            req.session.Admin = true;
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');

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
    const categories = await models.Category.find()
    console.log(categories)
    res.render('admin/category', { categories: categories, error: "" });
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
        console.log(category);


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

exports.getEdit = async (req, res) => {
    const categoryId = req.params.id;

    const category = await models.Category.findOne({ _id: categoryId });

    res.render('admin/editCategory',{error:"",category})
}

exports.editCategory = async (req, res) => {

    const category = req.body.category
    const description = req.body.description;
    try {
        await models.Category.updateOne({ _id: req.params.id }, { categoryName: category, description });
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

exports.getProductPage = (req, res)=>{
    res.render('admin/products')
}

exports.postProducts = (req ,res)=>{
    const productName = req.body.productName;
    const image = req.body.image;
    

}