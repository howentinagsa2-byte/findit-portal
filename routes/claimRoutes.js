const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');

router.post('/', async (req, res) => {
  try {
    const newClaim = new Claim(req.body);
    const savedClaim = await newClaim.save();
    res.status(201).json(savedClaim);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;