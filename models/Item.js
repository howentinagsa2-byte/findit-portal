const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['Lost', 'Found', 'Claim Pending', 'Resolved'], default: 'Found' },
  location: { type: String, required: true },
  description: { type: String, required: true },
  postedBy: { type: String, default: 'Student User' },
  imageUrl: { type: String },
  dateLostOrFound: { type: String, required: true },
  claimProof: {
    submittedBy: String,
    proofText: String,
    submittedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);