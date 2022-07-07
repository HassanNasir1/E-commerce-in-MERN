const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        maxlength: [50, 'Name must be less than 50 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validator: [validator.isEmail, 'Please enter a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false,
    },
    // avatar: {
    //     public_id:{
    //         type: String,
    //         required: true
    //     },
    //     url:{
    //         type: String,  
    //         required: true
    //     }
    // },
    role: {
        type: String,
        default: 'user'
    },
    createdAt:{
        type: Date,
        default: Date.now()
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date   
});

//Encrypting password before saving user

userSchema.pre('save', async function(next){
    if(!this.isModified("password")) {next();}

    this.password = await bcrypt.hash(this.password, 10);
    //the more value to give the more its encrpted by minimum must be 1000
})

userSchema.methods.getJwtToken = function() {
    return jwt.sign({id:this._id} , process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_TIME
    })
}
userSchema.methods.comparedPassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.getResetPasswordToken = function() {

    //Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    //hash and save to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    //set token expire time

    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000 //token will expire after 30 Minutes 
    return resetToken
}
module.exports = mongoose.model('User', userSchema);
