const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Get all items with search & filter
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category && category !== 'All Items') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a new item
router.post('/', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Submit claim proof
router.patch('/:id/claim', async (req, res) => {
  try {
    const { proofText, submittedBy } = req.body;
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Claim Pending',
        claimProof: { submittedBy, proofText, submittedAt: new Date() }
      },
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Resolve / verify claim (Security Admin Action)
router.patch('/:id/resolve', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved' },
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;