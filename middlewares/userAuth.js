
exports.userLogout = (req, res)=>{
    req.session.email = null;
    res.redirect('/user/login');
}

exports.isLogged = (req, res, next)=>{
    if (req.session.email){
       return res.redirect('/user/home')
    }
    next()
}
exports.userAuth = (req, res, next)=>{
    if (req.session.email){
        next()
    }else{
        res.redirect('/user/login');
    }
}