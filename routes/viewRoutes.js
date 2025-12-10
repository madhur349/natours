const express = require("express");
const viewController = require("./../controllers/viewController");
const authController = require("./../controllers/authController");
const bookingController = require("./../controllers/bookingController");
const router = express.Router();

router.get("/", bookingController.createBookingCheckout, authController.isLoggedIn, viewController.getOverview);

router.get("/tours/:slug", authController.isLoggedIn, viewController.getTour);
router.get("/tours/:slug/book", authController.protect, viewController.getBookingPage);
router.get("/my-tours", authController.protect, viewController.getMyTours);
router.get("/login", authController.isLoggedIn, viewController.getLoginForm);
router.get("/me", authController.protect, viewController.getAccount);



router.post("/submit-user-data", authController.protect, viewController.updateUserData);

module.exports = router;
