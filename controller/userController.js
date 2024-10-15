const models = require('../models/userModels');


exports.getIndexPage = (req, res)=>{
    if(req.session.email){
        return res.redirect('/user/home');
       
     }
    res.render('user/index');

}
exports.getHomePage = (req, res)=>{
    if(!req.session.email){
        return res.redirect('/user/login');
       
     }
    res.render('user/home');

}



//Get user login page 

exports.getLoginPage = (req,res)=>{
    if(req.session.email){
      return res.redirect('/user/home');
     
   }
    res.render('user/login',{ message: '', title:"Login page" });
  
};


exports.postLogin = async (req,res)=>{
    // const { USERNAME, FULLNAME, PASSWORD } = req.body;
    const EMAIL = req.body.email;
    const PASSWORD = req.body.password;
    
    const userDetails = await models.User.findOne({email:EMAIL,password:PASSWORD});
    if(userDetails){
        req.session.email = EMAIL;
        // req.session.fullName = FULLNAME;
  
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
  
        res.redirect('/user/home');
      } else{
        
  
        return  res.render('user/login',{ message: 'Invalid username or password', title:"Login page" });
      }
      
      
    
  
  };


exports.getSignupPage = (req, res)=>{
    res.render('user/signup',{message:""});
  
};



exports.postSignup = async (req,res)=>{
    console.log("kdjhagflkjhd")
    const FULLNAME = req.body.fullName;
    const USERNAME = req.body.userName;
    const PHONE = req.body.phone;
    const EMAIL = req.body.email;
    const PASSWORD = req.body.password;
    // const CONFIRMPASS = req.body.confirmPass;
    const userDetails = await models.User.findOne({email:EMAIL}); 
    console.log(FULLNAME);
    
    if(userDetails){
        res.render('user/signup',{message:"This email already has an account "});
  
  
    }else {
        const newUser = new models.User({
            fullName:FULLNAME,
            userName:USERNAME,
            phone:PHONE,
            email:EMAIL,
            password:PASSWORD
    
        })
        await newUser.save()
        .then(()=>{console.log("Success...")})
        .catch((err)=>console.log('error occured',err));
        res.redirect('/user/login');
  
    }
  };


  