const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// POST /api/auth/register — Admin only: create a new user
router.post('/register', auth, isAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    let finalRole = 'user';
    if (req.user.role === 'super_admin' && role === 'admin') {
      finalRole = 'admin';
    }

    let finalCreatedBy = req.userId;
    if (req.user.role === 'super_admin' && req.body.createdBy) {
      finalCreatedBy = req.body.createdBy;
    }

    const newUser = new User({
      username: username.toLowerCase().trim(),
      password,
      role: finalRole,
      createdBy: finalCreatedBy,
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/logout
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout.' });
  }
});

module.exports = router;
