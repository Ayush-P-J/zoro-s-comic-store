const { type } = require("express/lib/response");
const mongoose = require("mongoose");



const adminSchema = new mongoose.Schema({
    email:{
        type:String,
        unique: true
    },
    password:{
        type:String,
        required:true,
    }
});

const Admin = mongoose.model('admin',adminSchema);

// module.exports = Admin;

module.exports = {
    Admin,
}