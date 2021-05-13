const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../../dev-data/data/tours.json`)
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/../../dev-data/data/users.json`)
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/../../dev-data/data/reviews.json`)
);

dotenv.config({ path: `${__dirname}/../../config.env` });
// console.log(process.env);
// console.log({ __dirname }, { tours });
const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() =>
    console.log('DB Connection Successful \n+-+-+-+-+-+-+-+-+-+-+-+-')
  );

const importdb = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);

    console.log('Data imported successfully.');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deletedb = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Data deleted successfully.');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importdb();
} else if (process.argv[2] === '--delete') {
  deletedb();
}
