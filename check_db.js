require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/premier_scanner';

mongoose.connect(MONGO_URI)
  .then(async () => {
    const users = await User.find({}, 'username role createdBy');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
