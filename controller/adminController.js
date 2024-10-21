const { redirect } = require('express/lib/response');
const models = require('../models/adminModels');
const user = require('../models/userModels');

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


exports.getUserList = async ( req, res)=>{
    const userData = await user.User.find();

    res.render('admin/userList',{userData:userData});
}


exports.blockUser = async ( req, res) =>{
    try {
        const userId = req.params.id;
    const isBlock = await user.User.findOne({_id:userId})
    
    console.log(isBlock.isBlocked);
    
    if (isBlock.isBlocked === true){
        await user.User.updateOne({_id:userId},{$set:{isBlocked:false}});
        // console.log(isBlocked);
        console.log("UNBLOCKED");
        res.redirect('/admin/userList');
    } else {
        await user.User.updateOne({_id:userId},{$set:{isBlocked:true}});
        // console.log(isBlocked);
        console.log("BLOCKED");
        res.redirect('/admin/userList');
        
    }
        
    } catch (error) {
        res.status(500).send("Internal server error");
        
    }

}
