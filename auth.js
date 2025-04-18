const express = require('express');
const router = express.Router();
const User = require('../models/User');
const path = require('path');

// Show login form
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Handle login form submission
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });

  if (user) {
    res.send('Login successful!');
  } else {
    res.send('Invalid email or password.');
  }
});

// Show registration form
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

// Handle registration
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.send('User already exists.');
  }

  const newUser = new User({ email, password });
  await newUser.save();
  res.send('Registration successful!');
});

module.exports = router;
