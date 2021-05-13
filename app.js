const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.enable('trust proxy');

// # 0) Setting Template engine
//sets pug as the view engine
app.set('view engine', 'pug');
//looks for views in __dirname/views/
app.set('views', path.join(__dirname, 'views'));

// used 'better comments' extension
// # 1) GLOBAL MIDDLEWARES

// not in the course (put from stackoverflow to test problem: cookie not being stored in browser)
// <solved>: Issue was => server was running on 127.0.0.1:8050 but in browser i had opened localhost:8050
//                        and localhost could be (and was being) mapped to another ip too, hence cors problem occured
// app.use(cors());
// app.use(cors({ origin: true, credentials: true }));

//Set security http headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //1 hour
  message: 'Too many requests from this IP. Please try again in an hour'
});
app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
//Cookie parser, parses Cookie header and populate req.cookies with an object keyed by the cookie names.
app.use(cookieParser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//serving static files (pug, css, img)
// app.use(express.static(`${__dirname}/public`));  //in this way we have to take care of '/'
app.use(express.static(path.join(__dirname, 'public')));

//preventing http parameter pollution (hpp)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
      'maxGroupSize',
      'difficulty',
      'durationWeeks'
    ]
  })
);

// compresses all the text (not images) that are sent to the client
app.use(compression());

// # 2) ROUTES
app.get('/*', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Handling undefined routes requests
app.all('*', (req, res, next) => {
  //anything inside next() is treated as an error and controls jumps to immediate error handler
  next(new AppError(404, `The route ${req.originalUrl} does not exist yet!`));
});

// # 3) GLOBAL ERROR HANDLER
//this method with 4 parameters is an Error Handler
app.use(globalErrorHandler);

module.exports = app;
