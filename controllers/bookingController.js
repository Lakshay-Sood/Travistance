const stripe = require('stripe')(process.env.STRIPE_SK);

const catchAsync = require('../utils/catchAsync');
// const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');

exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // ** sendind to a temp url so as to add this booking in the database upon successful payment
    success_url: `${req.protocol}://${req.get('host')}/?tourId=${
      req.params.tourId
    }&userId=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        name: tour.name,
        description: tour.summary,
        images: [
          'https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fclipart-library.com%2Fimg%2F2047024.png&f=1&nofb=1'
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = async (req, res, next) => {
  // ! this is am insecure route  (cuz anyone who know the url pattern can create a fake booking)
  // wont have this problem if we used stripe paid version, cuz it gives us access to its webhooks

  const { tourId, userId, price } = req.query;
  if (!tourId || !userId || !price) return next();

  await Booking.create({ tour: tourId, user: userId, price });

  // to provide a bit security cuz user wont be able to see the unsafe url
  res.redirect(req.originalUrl.split('?')[0]);
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBookingById = factory.getOne(Booking);
exports.createBooking = factory.CreateOne(Booking);
exports.updateBookingById = factory.UpdateOne(Booking);
exports.deleteBookingById = factory.deleteOne(Booking);
