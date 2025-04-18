const mongoose = require('mongoose');

const recoverySchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  recoveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recoveryDate: {
    type: Date,
    default: Date.now
  },
  recoveredAmount: {
    type: Number,
    required: true
  },
  recoveryType: {
    type: String,
    enum: ['FULL', 'PARTIAL'],
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  remarks: {
    type: String
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Recovery', recoverySchema);
