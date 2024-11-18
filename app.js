const express = require("express");
const app = express();
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const env = require("dotenv").config()

const nocache = require('nocache');




app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});




const path = require('path');
const passport = require("passport")

require('./config/passport')



const userRouter = require('./router/userRouter')
const adminRouter = require('./router/adminRouter')

const models = require('./models/userModels')

//Port
const PORT = process.env.PORT || 3007;


app.use(expressLayouts);//Using layouts

app.use(express.static('public')); //Using static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');




app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));

models.connection();

app.use(passport.initialize());
app.use(passport.session())

app.use('/admin', nocache(), adminRouter);

app.use((req, res, next) => {
    if (req.isAuthenticated() && req.path === '/admin/login') {
        return res.redirect('/admin/index'); // Redirect to dashboard or home after login
    }
    next();
});





app.use('/', userRouter);
app.use('/admin', adminRouter);





app.listen(PORT, () => console.log(`Server is running at ${PORT}`));



