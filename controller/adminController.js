const { redirect } = require('express/lib/response');
const models = require('../models/adminModels');

exports.getLogin = (req, res)=>{
    if (req.session.admin){
        return res.redirect('/admin/dashBoard');

    }
    
    res.render('admin/login',{ message: '', title:"Login page" });
}

exports.postLogin = async (req, res)=>{
    try{
         const email = req.body.email;
         const password = req.body.password;
        // const EMAIL = "admin@gmail.com"

         const adminExist = models.Admin.findOne({email:email});
         if (!adminExist){

            return res.render('admin/login',{ message: 'Invalid Email', title:"Login page" });

         }
        // const adminVerify = await bcrypt.compare(password,adminExist.password)
        const adminVerify = models.Admin.findOne({password:password});
        

        if (adminVerify){
            req.session.admin = true;
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');

            res.redirect('/admin/index')
      
            
        } else{
            return res.render('admin/login',{ message: 'Invalid password', title:"Login page" });
            
        }


        

    } catch (error) {
        
        res.status(500).send("Internal server error")
    }
}

exports.getIndex = (req, res)=>{
    res.render('admin/index')
}