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







// app.use((req, res, next) => {
//     res.locals.spinnerHTML = `
//     <div id="loadingSpinner" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
//         <div class="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
//     </div>`;
//     next();
// });




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



