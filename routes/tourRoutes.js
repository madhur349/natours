const express = require("express");
const tourController = require("./../controllers/tourController");
const authController = require("./../controllers/authController");
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();
// router.param('id',tourController.checkId);

// Use review router for nested routes
router.use('/:tourId/reviews', reviewRouter);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);

router
  .route("/")
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(authController.protect,authController.restrictTo("admin","lead-guide"),tourController.uploadTourImages,tourController.resizeTourImages,tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo("admin","lead-guide"),
    tourController.deleteTour,
  );

module.exports = router;
