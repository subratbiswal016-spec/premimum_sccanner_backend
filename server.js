require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scans');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Premier Module Scanner API is running.' });
});

// Seed default super_admin account
async function seedAdmin() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin123',
        role: 'super_admin',
      });
      await admin.save();
      console.log('✅ Default super_admin account created (username: admin, password: admin123)');
    } else if (adminExists.role !== 'super_admin') {
      adminExists.role = 'super_admin';
      await adminExists.save();
      console.log('✅ Existing admin account promoted to super_admin');
    } else {
      console.log('ℹ️  super_admin account already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/premier_scanner';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    await seedAdmin();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
