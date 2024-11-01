const { redirect } = require("express/lib/response")

exports.isLogged = (req, res, next)=>{
    if (req.session.Admin){
       return res.redirect('/admin/index')
    }
    next()
}

exports.adminAuth = (req, res, next)=>{
    if (req.session.Admin){
        next()
    }else{
        res.redirect('/admin/login');
    }
}

exports.adminLogout = (req, res)=>{
    req.session.Admin = null;
    res.redirect('/admin/login');
}

