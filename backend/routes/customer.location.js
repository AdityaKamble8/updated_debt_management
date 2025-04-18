const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth.middleware');
const Customer = require('../models/customer.model');

// @route   POST /api/customers/:id/location
// @desc    Add a location entry to a customer
// @access  Private (any logged-in user)
router.post('/:id/location', protect, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'Latitude and longitude are required and must be numbers.' });
    }
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const newLocation = {
      lat,
      lng,
      addedBy: req.user._id,
      timestamp: new Date()
    };
    customer.locations.push(newLocation);
    await customer.save();
    res.status(200).json({ message: 'Location saved', location: newLocation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
