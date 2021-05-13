const Review = require('../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  //allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getReviewById = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.CreateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.UpdateOne(Review);
