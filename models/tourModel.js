const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// # 1) DEFINING SCHEMA
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name field is required'],
      unique: true,
      trim: true,
      minlength: [5, 'Minimum length of Name is 5'],
      maxlength: [20, 'Maximum length of Name is 20']
      // validate: validator.default.isAlpha
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Duration field is required']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'MaxGroupSize field is required']
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty field is required'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty should be either: easy, medium, difficult'
      }
    },
    price: {
      type: Number,
      required: [true, 'Price field is required']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //this ONLY points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Price discount should be less than price of tour.'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1.0, 'Rating can not be below 1.0'],
      max: [5.0, 'Rating can not be above 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: String,
      default: false
    },
    startLocation: {
      type: {
        type: 'String',
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: 'String',
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// # 2) INDEXING
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
//geo-spacial index
tourSchema.index({ startLocation: '2dsphere' });

// # 3) VIRTUAL FIELDS
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// # 4) DOCUMENT MIDDLEWARES
//runs on save() and create() only. NOT on update or insertMany...
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.post('save', function(doc, next) {
//   console.log('Document successfully saved');
//   next();
// });

// # 5) QUERY MIDDLEWARES
tourSchema.pre(/^find/, function(next) {
  this.find({
    secretTour: { $ne: true }
  });
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// tourSchema.post(/^find/, function(doc, next) {
//   console.log('Find Query Successful.');
//   next();
// });

// # 6) AGGREGATE MIDDLEWARES
// tourSchema.pre('aggregate', function(next) {
//   // console.log(this.pipeline());
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: 'true' } }
//   });
//   next();
// });

// tourSchema.post('aggregate', function(doc, next) {
//   console.log('Aggregation successful.');
//   next();
// });

// # 7) CREATING MODEL
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
