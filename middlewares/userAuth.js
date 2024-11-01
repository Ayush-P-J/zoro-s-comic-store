
exports.userLogout = (req, res)=>{
    req.session.email = null;
    res.redirect('/user/login');
}