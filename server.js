const mongoose = require('mongoose');
const dotenv = require('dotenv');

//This is kept at the start of file so as to start listening to uncaught exceptions right away.
//example of such error is console.log(abc). and it logs 'ReferenceError abc is not defined'.
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION ❌. Shutting Down...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// ## Setting up connection to mongoDB
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

//Listen to port
const port = process.env.PORT || 8050;
const server = app.listen(port, () => {
  console.log(`+-+-+-+-+-+-+-+-+-+-+-+-\nApp running on port: ${port}`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION ❌. Shutting Down...');
  server.close(() => {
    process.exit(1);
  });
});
