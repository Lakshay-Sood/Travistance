const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authController.isLoggedIn);

router.use(viewController.alerts);

router.get(
  '/',
  // bookingController.createBookingCheckout, //cuz stripe redirects to home page upon successful payment BUT now we use stripe webhooks
  viewController.getOverview
);
router.get('/tour/:slug', viewController.getTour);
router.get('/login', viewController.getLoginForm);

router.get('/me', authController.protect, viewController.getUser);
router.get(
  '/my-bookings',
  authController.protect,
  viewController.getUserBookings
);

module.exports = router;
