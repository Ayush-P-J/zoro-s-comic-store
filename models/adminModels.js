const { type } = require("express/lib/response");
const mongoose = require("mongoose");



exports.adminSchema = new mongoose.Schema({
    admin:{
        type:String,
        unique: true
    },
    password:{
        type:String,
        required:true,
    }
});
