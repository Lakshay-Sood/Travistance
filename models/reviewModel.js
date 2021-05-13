const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      maxlength: [500, 'character count is limited to 500'],
      required: [true, 'The content of review is missing'],
      trim: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      max: [5, 'Rating can not be above 5'],
      min: [1, 'Rating can not be below 1']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//so that a user cant create more than 1 review on the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name'
  //   })
  //     .populate({
  //       path: 'user',
  //       //next line gives ERROR if tour is also populated: "errmsg": "Projection cannot have a mix of inclusion and exclusion."
  //       select: 'name photo'
  //     })
  //     .select('-__v');

  // Alternate to above code
  this.populate({
    path: 'user',
    select: '-__v -passwordChangedAt -email'
  }).select('-__v');

  next();
});

reviewSchema.statics.calcAverageRating = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating, //figured [0] out by looking at console.log(stats)
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4 //we consider 4 as default rating
    });
  }
};

//this is a helper function to the post()
//cuz here we can use query middleware findOne() and provide it to post()
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //here, 'this' is current query var
  this.rev = await this.findOne();
});

reviewSchema.post(/^findOneAnd/, function() {
  //await this.findOne(); does not work here cuz query has already been executed
  this.rev.constructor.calcAverageRating(this.rev.tour);
});

reviewSchema.post('save', function() {
  //'this' points to the current review
  //and its constructor is the Model who created it (here, Review)
  this.constructor.calcAverageRating(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
