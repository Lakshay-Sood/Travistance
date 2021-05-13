const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/create-session/:tourId')
  .get(bookingController.createCheckoutSession);

router.use(authController.restrict('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBookingById)
  .patch(bookingController.updateBookingById)
  .delete(bookingController.deleteBookingById);

module.exports = router;
