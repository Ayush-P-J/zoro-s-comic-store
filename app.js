const express = require("express");
const app = express();
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

const path = require('path');


const userRouter = require('./router/userRouter')

const models = require('./models/userModels')

//Port
const PORT = process.env.PORT || 3006;


app.use(expressLayouts);//Using layouts

app.use(express.static('public')); //Using static files
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

app.set('view engine', 'ejs');

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

models.connection();

app.use('/user',userRouter);

app.listen(PORT,()=> console.log(`Server is running at ${PORT}`));
