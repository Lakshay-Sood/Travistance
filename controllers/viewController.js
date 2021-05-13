const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getUserBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).sort('-createdAt');
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  // ** tried to show booked tours sorted by booked date
  // const tours = [];
  // await Promise.all(
  //   tourIDs.map(async tourID => {
  //     tours.push(await Tour.findById(tourID));
  //   })
  // );

  res.status(200).render('overview', {
    title: 'My Bookings',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) return next(new AppError(400, 'No such tour exists!'));

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getUser = (req, res, next) => {
  const user = res.locals.user; //it is set from the isLoggedIn()

  if (!user) return next(new AppError(400, 'You are not logged in'));

  res.status(200).render('user', {
    title: 'My Account'
    // user   we dont have to pass user here cuz its already in the res.locals
  });
};

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking') {
    res.locals.alert = `Your booking was successful. Please check your email. <br>If the booking doesn't show up here, check again later.`;
  }

  next();
};
