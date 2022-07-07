const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const User = require('../models/user');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto');
const { status } = require('express/lib/response');
const res = require('express/lib/response');
//Register a user => /api/v1/register
exports.registerUser = catchAsyncErrors(async function(req, res, next) {
    const { name, email, password} = req.body;
    const user = await User.create({ 
        email,
        name,
        password
        // ,avatar:{
        //     public_id: '',
        //     url: ''
        // } 
    });
    sendToken(user, 201, res);
});
// login user => /api/v1/login

exports.loginUser = catchAsyncErrors(async function(req, res, next) {
    const {email, password} = req.body;
    if(!email||!password){
        return next(new ErrorHandler('Please provide email and password', 400));
    }
    const user = await User.findOne({email}).select('+password');
    if(!user){
        return next(new ErrorHandler('Invalid email or password', 401));
    }
    const isPasswordMatched = await user.comparedPassword(password);
    if(!isPasswordMatched){
        return next(new ErrorHandler('Invalid email or password', 401));
    }
    sendToken(user, 201, res);
})
// forgot password => /api/v1/password/forgot

exports.forgotPassword = catchAsyncErrors ( async (req,res,next) => {
    const user = await User.findOne({email: req.body.email})
    if(!user){
        return next(new ErrorHandler('User not found with this email address', 404));
    }
    // get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave: false});

    //create reset password url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`
    
    const message = `Your password reset token is as follows \n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`
    try {
        await sendEmail({
            email: user.email, 
            subject: "ShopIT Password Recovery",
            message
        })
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({validateBeforeSave: false})

        return next(new ErrorHandler(error.message, 500))
    }
})
// reset password => /api/v1/password/reset/:token

exports.resetPassword = catchAsyncErrors ( async (req, res, next) => {

    //Hash url tokem
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    
    const user = await User.findOne({ 
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })
    
    if(!user) {
        return next(new ErrorHandler("Password reset token is invalid or has been expired", 400));
    }
    
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password doesn't match", 400));
    }
    //set the new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save();
    sendToken(user, 200, res); 
 
})
// get currently logged in user detail => /api/v1/me
exports.getUserProfile = catchAsyncErrors( async (req,res,next) => {
    const user = await User.findById(req.user.id)

    res.status(200).json({
        success: true,
        user
    })

})
// update / change password => /api/v1/password/update
exports.updatePassword = catchAsyncErrors ( async(req, res,next)=>{
    const user = await User.findById(req.user.id).select('+password')
    //check previous password
    const isMatched = await user.comparedPassword(req.body.oldPassword)
    if(!isMatched){
        return next(new ErrorHandler("Old Password is not correct", 400))
    }
    user.password = req.body.password
    await user.save()
    sendToken(user,200, res);
})
//update user profile => /api/v1/me/update
exports.updateProfile = catchAsyncErrors ( async(req, res,next)=>{
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    //update avatar when i have cloudnery funtionality // TODO later

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators:  true,
        useFindAndModify: false
    })
    res.status(200).json({
        success: true,

    })
})

//logout user => /api/v1/logout
exports.logout = catchAsyncErrors( async (req, res,next) => {
    res.cookie('token',null,{
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    })
})

//Admin routes

//get all users => /api/v1/admin/users
exports.allUsers = catchAsyncErrors ( async(req, res, next)=>{
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
})

//get user details => /api/v1/admin/user/:id
exports.getUserDetails = catchAsyncErrors( async (req, res,next) => {
    const user = await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler(`User doesn't found with id: ${req.params.id}`));
    }
    res.status(200).json({
        success: true,
        user
    })
})

//update user profile by admin => /api/v1/admin/user/:id 
exports.updateUser = catchAsyncErrors ( async(req, res,next)=>{
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    //update avatar when i have cloudinary funtionality // TODO later

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators:  true,
        useFindAndModify: false
    })
    res.status(200).json({
        success: true,
    })
})
//delete user by admin  => /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors( async (req, res,next) => {
    const user = await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler(`User doesn't found with id: ${req.params.id}`));
    }
    //remove avatar from cloudinary // todo later
    await user.remove();

    res.status(200).json({
        success: true,
    })
})