const express = require("express");
const app = express();
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const env = require("dotenv").config()

const userRouter = require('./router/userRouter')
const adminRouter = require('./router/adminRouter')
const cacheController = require('./utilities/cacheControl')
const models = require('./models/userModels')
const path = require('path');
const passport = require("passport")
require('./config/passport')


const nocache = require('nocache');




app.use(cacheController.cacheControl)











//Port
const PORT = process.env.PORT || 3007;


app.use(expressLayouts);//Using layouts

app.use(express.static('public')); //Using static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');


app.use(cacheController.sessionControl);

models.connection();

app.use(passport.initialize());
app.use(passport.session())







app.use('/admin', adminRouter);
app.use('/', userRouter);



nocache();

app.listen(PORT, () => console.log(`Server is running at ${PORT}`));



