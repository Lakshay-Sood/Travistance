const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIfeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError(404, `No document found with the id: ${req.params.id}`)
      );
    }

    res.status(204).json({
      status: 'success',
      data: {
        data: null
      }
    });
  });

exports.UpdateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(
        new AppError(404, `No document found with the id: ${req.params.id}`)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.CreateOne = Model =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //to support nested route: tour/:tourId/reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIfeatures(Model.find(filter), req.query);
    features
      .filter()
      .sort()
      .fieldLimit()
      .paginate();

    // const doc = await features.query.explain();
    const doc = await features.query;

    //SENDING RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(
        new AppError(404, `No document found with the id: ${req.params.id}`)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });
