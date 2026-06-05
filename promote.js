require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/premier_scanner';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    const adminExists = await User.findOne({ username: 'admin' });
    if (adminExists && adminExists.role !== 'super_admin') {
      adminExists.role = 'super_admin';
      await adminExists.save();
      console.log('✅ Existing admin account promoted to super_admin');
    } else {
      console.log('ℹ️  super_admin account already exists or admin not found.');
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
