const Review = require("./../models/reviewModels");
const catchAsync = require("../utils/catchAsync");

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  
  const reviews = await Review.find(filter).populate({
    path: 'tour',
    select: 'name'
  });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReview = await Review.create(req.body);

  // Fetch the complete review with populated tour and user
  const populatedReview = await Review.findById(newReview._id).populate({
    path: 'tour',
    select: 'name'
  });

  res.status(201).json({
    status: "success",
    data: {
      review: populatedReview,
    },
  });
});
