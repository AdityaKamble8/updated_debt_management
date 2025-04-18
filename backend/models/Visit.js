const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  feedbackText: { type: String, required: true },
  imageUrl: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  visitDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visit', VisitSchema);
