const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  srNo: {
    type: String,
    required: true,
    unique: true
  },
  branch: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true,
    unique: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  schemeCode: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    required: true
  },
  sanctionLimit: {
    type: Number,
    required: true
  },
  dateOfNPA: {
    type: Date,
    required: true
  },
  outstandingBalance: {
    type: Number,
    required: true
  },
  principleOverdue: {
    type: Number,
    required: true
  },
  interestOverdue: {
    type: Number,
    required: true
  },
  netBalance: {
    type: Number,
    required: true
  },
  provision: {
    type: String,
    required: true
  },
  anomalies: {
    type: String,
    default: 'None'
  },
  assetClassification: {
    type: String,
    required: true
  },
  assetTagging: {
    type: String,
    required: true
  },
  contactNo: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  isRecovered: {
    type: Boolean,
    default: false
  },
  recoveryDate: {
    type: Date
  },
  recoveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  locations: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true
});

// Index for faster queries
customerSchema.index({ branch: 1, isRecovered: 1 });
customerSchema.index({ assetClassification: 1 });
customerSchema.index({ dateOfNPA: 1 });

module.exports = mongoose.model('Customer', customerSchema);
