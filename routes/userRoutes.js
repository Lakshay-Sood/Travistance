const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

//only logged in people can access the routes below
router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUserById);
router.patch(
  '/update-me',
  userController.uploadUserPhoto,
  userController.resizeUploadedPhoto,
  userController.updateMe
);
router.delete('/delete-me', userController.deleteMe);

//only admin can access the routes below
router.use(authController.restrict('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.postUser);
router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUserById)
  .delete(userController.deleteUserById);

module.exports = router;
