// const clone = require('clone'); //a library to provide Deep Cloning
const AppError = require('./../utils/appError');

// # 1) Handling common mongoose and mongodb errors
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(400, message);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/"([^"]*)"/)[0]; //regex to extract string (name) within the quotes
  const message = ` Duplicate field value ${value}. Please use another value.`;
  return new AppError(400, message);
};

const handleValidatorErrorDB = err => {
  const errors = Object.values(err.errors)
    .map(el => el.message)
    .join('. ');
  const message = `Invalid input data. ${errors}`;
  console.log(message);
  return new AppError(400, message);
};

//omitted 'err' as parameter as it isnt required
const handleJWTError = () => {
  return new AppError(401, 'Invalid token! Please log in again to continue.');
};
const handleTokenExpiredError = () => {
  return new AppError(401, 'Token expired! Please log in again to continue.');
};

// # 2) Sending JSON/Rendered Error
// # Sending Errors in Development mode
const sendErrorDev = (err, req, res) => {
  // A) JSON response for api calls
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // B) Rendered response for non-api calls
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    errorMsg: err.message
  });
};

// # Sending Errors in Production mode
const sendErrorProd = (err, req, res) => {
  // A) JSON response for api calls
  if (req.originalUrl.startsWith('/api')) {
    // A1) Operational, trusted error: send message to client
    if (err.isOperational)
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });

    // A2) Programming or other unknown error: dont leak error details
    //1)Log the Error
    console.error('ERROR🎇 \n', err);
    //2)Send generic response
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong'
    });
  }

  // B) Rendered response for non-API calls
  // B1) Operational, trusted error: send message to client
  if (err.isOperational)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      errorMsg: err.message
    });

  // B2) Programming or other unknown error: dont leak error details
  console.error('ERROR🎇 \n', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    errorMsg: 'Please try again later!'
  });
};

// # 3) Defining Global Error Handler function
//* Actual function that gets imported as globalErrorHandler in app.js
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = { ...err }; //this didnt provide copying of variables inherited from the Error Class like 'message', 'stack'
    // let error = clone(err);
    let error = Object.create(err);

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    else if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    else if (error.name === 'ValidationError')
      error = handleValidatorErrorDB(error);
    else if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    else if (error.name === 'TokenExpiredError')
      error = handleTokenExpiredError(error);

    sendErrorProd(error, req, res);
  } else {
    console.log('this is unknown error');
  }
};
