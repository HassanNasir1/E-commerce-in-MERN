const jwt = require('jsonwebtoken');
const catchAsyncErrors = require('./catchAsyncErrors');
const User = require('../models/user');
const ErrorHandler = require('../utils/errorHandler');
// checks if user is authenticated
exports.isAuthenticatedUser = catchAsyncErrors( async (req, res, next) => {

    const { token }  =  req.cookies;
    if(!token){
        return next(new ErrorHandler('Please login to access this route',401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id);
    next()
})
//handling user roles
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role))
            return next (new ErrorHandler(`Role ${req.user.role} is not authorized to access this route`, 403))
        next();
    }
} 
