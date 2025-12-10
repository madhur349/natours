const Tour = require("../models/tourModels");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModels");
exports.getOverview = catchAsync(async (req, res, next) => {
  //1)Get tour data from collection
  const tours = await Tour.find();

  //2)build template

  //3)Render that template using tour data from 1)

  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async(req, res, next) => {
  //1) get the data, for the requested tour (including review and guides)
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  //2)Build Template
  //3)Render that template using data from 1)
  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour
  });
});


exports.getLoginForm = (req,res)=>{
 res.status(200).render('login',{
  title: 'Log into your account'
 })
}

exports.getAccount = (req,res)=>{
  res.status(200).render('account',{
  title: 'Your account'
 })
}

exports.updateUserData = catchAsync(async(req,res,next)=>{
const updatedUser = await User.findByIdAndUpdate(req.user.id,{
  name : req.body.name,
  email: req.body.email
},
{
  new: true,
  runValidators: true
});

 res.status(200).render('account',{
  title: 'Your account',
  user: updatedUser,
 })
})

exports.getBookingPage = catchAsync(async(req, res, next) => {
  // Get the tour by slug
  const tour = await Tour.findOne({ slug: req.params.slug });
  
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  res.status(200).render('booking', {
    title: `Book ${tour.name}`,
    tour,
    user: req.user || res.locals.user
  });
})

exports.getMyTours = catchAsync(async(req, res, next) => {
  // Get all bookings for the logged-in user
 const bookings = await Booking.find({ user: req.user.id });

 const tourIDs=bookings.map(el=>el.tour);
 const tours= await Tour.find({_id:{$in:tourIDs}});

 res.status(200).render("overview", {
  title: "All Tours",
  tours,
 });
})