const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const signSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //90 days (in millisecond) expiry
    ),
    httpOnly: true, //so that we can modify or delete it in the browser (secure way)
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; //removes password from output

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  });

  try {
    // this url is for the profile page (cuz welcome email template wants it)
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
  } catch (err) {
    console.log(err);
  }

  signSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //## 1) check if email and password are provided
  if (!email || !password)
    return next(new AppError(400, 'Please provide email and password'));

  //## 2) check if user exits and verify password
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError(401, 'Incorrect email or password'));

  //## 3) if all ok, generate token and return it
  signSendToken(user, 200, req, res);
});

//## checks if the user is logged in
exports.protect = catchAsync(async (req, res, next) => {
  //## 1) check if token is provided
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else
    return next(
      new AppError(401, 'You are not logged in. Please log in to continue.')
    );

  //## 2) check if the token is valid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //## 3) check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(401, 'The user corresponding to this token no longer exist.')
    );

  //## 4) check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError(
        401,
        'User recently changed password! Please login again to continue.'
      )
    );

  //## if all ok
  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

//used as a middleware to let the templates know if user is loggen in or not
//(enables _header.pug to render accordingly)
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  //## 1) check if token is provided
  if (req.cookies.jwt) {
    const token = req.cookies.jwt;

    if (token === 'loggedOut') return next(); //to check if jwt token was redeclared by the logout()

    //## 2) check if the token is valid
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //## 3) check if the user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();

    //## 4) check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) return next();

    //## if all ok
    res.locals.user = currentUser; //res.locals.xxxx makes xxxx available to templates
    return next();
  }

  return next();
});

exports.logout = (req, res, next) => {
  // req.cookies.jwt = undefined;  just doing this would have been sufficient; BUT we had set cookies to be httpOnly, thus we can modify or delete it

  const token = 'loggedOut'; //random string to invalidate previous token

  const cookieOptions = {
    expires: new Date(
      Date.now() + 5000 //5s (in millisecond) expiry
    ),
    httpOnly: true // thus we can modify or delete it in the browser (secure way)
  };

  res.cookie('jwt', token, cookieOptions);

  res.status(200).json({
    status: 'success'
  });
};

exports.restrict = (...roles) => {
  //returns this function because a middleware function has
  // parameters as req, res, next
  return (req, res, next) => {
    // console.log(req.user.role);
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          403,
          'You do not have permission to perform this operation'
        )
      );

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email)
    return next(new AppError(400, 'Please provide the email.'));

  //## 1) get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError(
        400,
        'No user exists with this email address! Sign Up instead.'
      )
    );

  //## 2) generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    //## 3) send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token send to your email.'
    });
  } catch (err) {
    // console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        500,
        'There was an error sending the email. Please try again later!'
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //## 1) generate hashed token for original token in url
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //## 2) find user with that token and check if this token is still valid
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gte: Date.now() }
  });

  if (!user) {
    return next(new AppError(400, 'Invalid or expired token.'));
  }

  //## 3) if all ok, update properties of user and log him in
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //* assigning value to 'passwordChangedAt' is done using save hook in userModel.js
  await user.save();

  signSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //## 1) get the specific user
  const user = await User.findOne({ _id: req.user._id }).select('+password');

  //## 2) verify the current password
  if (
    !req.body.currentPassword ||
    !(await user.correctPassword(req.body.currentPassword, user.password))
  )
    return next(new AppError(401, 'Current password is not correct'));

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  // assigning value to 'passwordChangedAt' is done using save hook in userModel.js
  await user.save();

  signSendToken(user, 200, req, res);
});
