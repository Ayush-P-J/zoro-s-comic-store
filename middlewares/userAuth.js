
exports.userLogout = (req, res) => {
    req.session.email = null;
    res.redirect('/');
}

exports.isLogged = (req, res, next) => {
    if (req.session.email) {
        return res.redirect('/home')
    }
    next()
}
exports.userAuth = (req, res, next) => {
    if (req.session.email) {
        next()
    } else {
        res.redirect('/login');
    }
}