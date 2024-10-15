const mongoose = require("mongoose");

async function connection(){
    return mongoose.connect('mongodb://127.0.0.1:27017/ecommerce')
    .then(()=>console.log("Mongoose connected..."))
    .catch((err)=>console.log("Error",err));
}

// schema of details
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        

    },
    userName:{
      type: String,
      required: true,

    },
    phone:{
      type: Number,
      required: true,

    },
    email:{
      type: String,
      required: true,

    },
    
    password: {
        required: true,
        type: String
    },
    // confirmPass: {
    //     required: true,
    //     type: String
    // }
});


//schema of otp
const userOTPSchema = new mongoose.Schema({
    userId:{
        type:String
    },
    otp:{
        type:String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5, // The document will be automatically deleted after 5 minutes of its creation time
    },

});


const OTP = mongoose.model('userOTP',userOTPSchema);
const User = mongoose.model('user',userSchema);




module.exports = {
    User,
    connection,
    OTP
}