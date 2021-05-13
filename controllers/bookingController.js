const stripe = require('stripe')(process.env.STRIPE_SK);

const catchAsync = require('../utils/catchAsync');
// const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');

exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // this (commented out) is am insecure route  (cuz anyone who know the url pattern can create a fake booking)
    // wont have this problem if we use stripe webhooks (which we do now)
    // ** used to send to a temp url so as to add this booking in the database upon successful payment
    // success_url: `${req.protocol}://${req.get('host')}/?tourId=${
    //   req.params.tourId
    // }&userId=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-bookings`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        name: tour.name,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
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

// exports.createBookingCheckout = async (req, res, next) => {
//   const { tourId, userId, price } = req.query;
//   if (!tourId || !userId || !price) return next();

//   await Booking.create({ tour: tourId, user: userId, price });

//   // to provide a bit security cuz user wont be able to see the unsafe url
//   res.redirect(req.originalUrl.split('?')[0]);
// };

exports.createBookingCheckout = async session => {
  // these attributes of session were checked from webhooks req sent
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;

  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBookingById = factory.getOne(Booking);
exports.createBooking = factory.CreateOne(Booking);
exports.updateBookingById = factory.UpdateOne(Booking);
exports.deleteBookingById = factory.deleteOne(Booking);
