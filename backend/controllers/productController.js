const { findById } = require('../models/product');
const Product = require('../models/product');
const ErrorHandler = require("../utils/errorHandler")
const catchAsyncErrors = require("../middlewares/catchAsyncErrors")
const ApiFeatures = require('../utils/apiFeatures');
const user = require('../models/user');
// Create new product => /api/v1/admin/product/new

exports.newProduct = catchAsyncErrors (async (req,res,next) => {

    req.body.user = req.user.id    
    const product = await Product.create(req.body)

    res.status(201).json({
        success: true,
        product
    })
})

// Get all products => /api/v1/products?keyword=apple

exports.getProducts = catchAsyncErrors ( async(req,res,next) => {

    //return next(new ErrorHandler('My Error', 400)) //just for testing error alert
    const resPerPage = 4;
    const productsCount = await Product.countDocuments();

    const apiFeatures = new ApiFeatures(Product.find(),req.query)
                        .search()
                        .filter()
                        .pagination(resPerPage);

    const products = await apiFeatures.query;
    res.status(200).json({
        success: true,
        products,
        resPerPage,
        productsCount

    })
})

//Get single product by its id => /api/v1/product/:id

exports.getSingleProduct = catchAsyncErrors (async(req,res,next) => {
    const product = await Product.findById(req.params.id);
    if(!product) {
        return next(new ErrorHandler('Product Not found',404));
    }
    res.status(200).json({
        success:true,
        product
    })
})
// update product => /api/v1/product/:id

exports.updateProduct = catchAsyncErrors (async (req,res,next) => {
    let product = await Product.findById(req.params.id);

    if(!product) {
        return next(new ErrorHandler('Product Not found',404));
    }
    product = await Product.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:  true,
        useFindAndModify:false
    });
    res.status(200).json({
        success:true,
        product
    })
})
//delete product => /api/v1/admin/product/:id

exports.deleteProduct = catchAsyncErrors (async (req,res,next) => {
    const product = await Product.findById(req.params.id);

    if(!product) {
        return next(new ErrorHandler('Product Not found',404));
    }
    await product.remove();
    res.status(200).json({
        success: true,
        message: "Product has been Deleted"
    })
})

// Create / update Reveiw  => /api/v1/reveiw 
exports.createProductReview = catchAsyncErrors (async (req,res,next) => {
    const { rating, comment, productId }  = req.body
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment 
    }
    const product = await Product.findById(productId)

    const isReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()   // r = review
    )
    if(isReviewed){
        product.reviews.forEach(review => {
            if(review.user.toString() === req.user._id.toString()) {
                review.comment = comment
                review.rating = rating
            }
            })

    } else {
        product.reviews.push(review)
        product.numOfReviews = product.reviews.length
    }
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0)/ product.reviews.length

    await product.save({validateBeforeSave: false})

    res.status(200).json({
        success: true,
    })
})

// Get Product Reviews  => api/v1/reviews

exports.getProductReviews = catchAsyncErrors (async (req,res,next) => {
    const product = await Product.findById(req.query.id)

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})

// Delete product Review  => /api/v1/reviews
exports.deleteReview = catchAsyncErrors (async (req,res,next) => {
    const product = await Product.findById(req.query.productId);
    console.log(product.reviews)
    const reviews = product.reviews.filter(review => review._id.toString()  !==  req.query.id.toString());
    console.log("reviews =>  ", reviews)
    const numOfReviews = reviews.length;
    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0)/ reviews.length
    console.log(ratings)

    await Product.findByIdAndUpdate(req.query.productId,{
        reviews,
        ratings,
        numOfReviews
    },{
        new: true,
        runValidators:  true,
        useFindAndModify: false
    })
    res.status(200).json({
        success: true,
    })
})