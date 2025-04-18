const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const Recovery = require('../models/recovery.model');
const Customer = require('../models/customer.model');

// @route   POST /api/recovery
// @desc    Create new recovery record
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { customerId, recoveredAmount, recoveryType, paymentMethod, remarks } = req.body;

    // Check if customer exists and user has access
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (req.user.role !== 'admin' && customer.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Not authorized to create recovery for this customer' });
    }

    // Create recovery record
    const recovery = new Recovery({
      customer: customerId,
      recoveredBy: req.user.id,
      recoveredAmount,
      recoveryType,
      paymentMethod,
      remarks
    });

    // Update customer recovery status
    customer.isRecovered = true;
    customer.recoveryDate = Date.now();
    customer.recoveredBy = req.user.id;

    await Promise.all([
      recovery.save(),
      customer.save()
    ]);

    res.status(201).json(recovery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recovery
// @desc    Get all recovery records with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      branch,
      recoveryType
    } = req.query;

    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.recoveryDate = {};
      if (startDate) query.recoveryDate.$gte = new Date(startDate);
      if (endDate) query.recoveryDate.$lte = new Date(endDate);
    }

    // Recovery type filter
    if (recoveryType) {
      query.recoveryType = recoveryType;
    }

    // Branch access control
    if (req.user.role !== 'admin') {
      const customers = await Customer.find({ branch: req.user.branch }).select('_id');
      query.customer = { $in: customers.map(c => c._id) };
    } else if (branch) {
      const customers = await Customer.find({ branch }).select('_id');
      query.customer = { $in: customers.map(c => c._id) };
    }

    const recoveries = await Recovery.find(query)
      .populate('customer', 'customerName accountNumber branch')
      .populate('recoveredBy', 'username')
      .sort({ recoveryDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Recovery.countDocuments(query);

    res.json({
      recoveries,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalRecoveries: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recovery/stats
// @desc    Get recovery statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.recoveryDate = {};
      if (startDate) query.recoveryDate.$gte = new Date(startDate);
      if (endDate) query.recoveryDate.$lte = new Date(endDate);
    }

    // Branch access control
    if (req.user.role !== 'admin') {
      const customers = await Customer.find({ branch: req.user.branch }).select('_id');
      query.customer = { $in: customers.map(c => c._id) };
    }

    const stats = await Recovery.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecovered: { $sum: '$recoveredAmount' },
          recoveryCount: { $sum: 1 },
          averageRecovery: { $avg: '$recoveredAmount' },
          fullRecoveries: {
            $sum: { $cond: [{ $eq: ['$recoveryType', 'FULL'] }, 1, 0] }
          },
          partialRecoveries: {
            $sum: { $cond: [{ $eq: ['$recoveryType', 'PARTIAL'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalRecovered: 0,
      recoveryCount: 0,
      averageRecovery: 0,
      fullRecoveries: 0,
      partialRecoveries: 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recovery/:id
// @desc    Get recovery by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const recovery = await Recovery.findById(req.params.id)
      .populate('customer', 'customerName accountNumber branch')
      .populate('recoveredBy', 'username');

    if (!recovery) {
      return res.status(404).json({ message: 'Recovery record not found' });
    }

    // Check if user has access to this recovery's branch
    if (req.user.role !== 'admin' && recovery.customer.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Not authorized to view this recovery' });
    }

    res.json(recovery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
