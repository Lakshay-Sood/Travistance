const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrict('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReviewById)
  .delete(
    authController.restrict('admin', 'user'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrict('admin', 'user'),
    reviewController.updateReview
  );

module.exports = router;
