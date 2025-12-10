const Tour = require("./../models/tourModels");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("./../utils/catchAsync");
const multer=require('multer');
const sharp=require('sharp');
const appError = require("./../utils/appError");

const multerStorage=multer.memoryStorage();

const multerFilter=(req,file,cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null,true);
  }else{
    cb(new AppError('Not an image! Please upload only images.',400),false);
  }
} ; 

const upload=multer({
  storage:multerStorage,
  fileFilter:multerFilter
});

exports.uploadTourImages =upload.fields([
  {name:'imageCover',maxCount:1},
  {name:'images',maxCount:3}
]);


// upload.single('image') req.file;
// upload.array('images',5) req.files;

exports.resizeTourImages = catchAsync(async(req,res,next)=>{
  if(!req.files.imageCover || !req.files.images) return next();
  //1) Cover image
  req.body.imageCover= `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333).toFormat('jpeg')
    .jpeg({quality:90})
    .toFile(`public/img/tours/${req.body.imageCover}`);
    //2) Images
    req.body.images=[];
    await Promise.all(req.files.images.map(async(file,index)=>{
      const filename= `tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000,1333).toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }));
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // Send response
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: { tours },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id)
  //Tour.findOne({_id:req.params.id})
  if(!tour){
   return next(new appError('No tour found with that ID',404))
  }
  res.status(200).json({
    status: "success",

    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
  // try {
  // const newTour =new Tour({})
  // newTour.save();
  // const newTour = await Tour.create(req.body);

  // res.status(201).json({
  //   status: "success",
  //   data: {
  //     tour: newTour,
  //   },
  // });
  //   } catch (err) {
  //     res.status(400).json({
  //       status: "fail",
  //       message: err,
  //     });
  //   }
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if(!tour){
   return next(new appError('No tour found with that ID',404))
  }
  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour =await Tour.findByIdAndDelete(req.params.id);

  if(!tour){
   return next(new appError('No tour found with that ID',404))
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match:{_id:{$ne:'easy'}}
    // }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregateI([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStats: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStats: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: "success",
    date: {
      plan,
    },
  });
});
