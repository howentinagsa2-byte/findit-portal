const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'finditadmin@gmail.com';

// Function to automatically sync and ensure the admin account always uses 'password123'
async function initializeAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      { 
        password: hashedPassword,
        isAdmin: true 
      },
      { upsert: true, new: true }
    );
    console.log('Built-in admin account synced securely.');
  } catch (err) {
    console.error('Error initializing admin account:', err);
  }
}

// Run initialization on server start
initializeAdmin();

// REGISTER ROUTE (Blocks anyone from signing up as admin)
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // STRICT CHECK: Block public registration using the admin email
    if (email.toLowerCase() === ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Registration for this email is restricted.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      isAdmin: false // Students are never admins
    });

    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Explicit check to assign admin flag based on email match
    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL;

    res.json({
      message: 'Logged in successfully',
      user: {
        email: user.email,
        isAdmin: isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

module.exports = router;