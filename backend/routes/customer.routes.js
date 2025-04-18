const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth.middleware');
const Customer = require('../models/customer.model');

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private (Admin/Manager)
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customers/bulk
// @desc    Create multiple customers
// @access  Private (Admin/Manager)
router.post('/bulk', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    // Process the incoming data to ensure assignedTo is properly set
    const processedData = req.body.map(customer => {
      // If assignedTo is provided and is a valid ObjectId string, keep it
      // Otherwise, set it to null
      if (customer.assignedTo && mongoose.Types.ObjectId.isValid(customer.assignedTo)) {
        return customer;
      } else {
        return { ...customer, assignedTo: null };
      }
    });

    // Track failed and successful entries
    const failedEntries = [];
    const successEntries = [];

    // Try to upsert each customer individually to catch per-entry errors
    for (const customer of processedData) {
      try {
        await Customer.updateOne(
          { customerId: customer.customerId },
          customer,
          { upsert: true, runValidators: true }
        );
        successEntries.push(customer);
      } catch (err) {
        let reason = err.message || 'Unknown error';
        if (err.code === 11000) {
          reason = 'Duplicate entry (customerId, accountNumber, or srNo)';
        }
        failedEntries.push({ customer, reason });
      }
    }

    if (failedEntries.length > 0) {
      return res.status(207).json({
        message: 'Some entries were not processed due to errors',
        failedEntries,
        successCount: successEntries.length,
        failedCount: failedEntries.length
      });
    }

    return res.status(201).json({
      message: 'All customers processed successfully',
      successCount: successEntries.length
    });
  } catch (err) {
    console.error('Error in bulk customer operation:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/customers/assign
// @desc    Assign customers to users
// @access  Private (Admin only)
router.post('/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, customerIds } = req.body;
    
    if (!userId || !customerIds || !Array.isArray(customerIds)) {
      return res.status(400).json({ message: 'Please provide userId and customerIds array' });
    }
    
    const result = await Customer.updateMany(
      { _id: { $in: customerIds } },
      { assignedTo: userId }
    );
    
    res.json({ message: `${result.modifiedCount} customers assigned successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customers/assign-branch
// @desc    Assign all customers from a branch to a user
// @access  Private (Admin only)
router.post('/assign-branch', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, branch } = req.body;
    
    if (!userId || !branch) {
      return res.status(400).json({ message: 'Please provide userId and branch' });
    }
    
    const result = await Customer.updateMany(
      { branch },
      { assignedTo: userId }
    );
    
    res.json({ message: `${result.modifiedCount} customers from branch ${branch} assigned successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers
// @desc    Get all customers with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      branch,
      isRecovered,
      search,
      sortBy = 'dateOfNPA',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === 'admin') {
      // Admin can see all customers, with optional branch filter
      if (branch) {
        query.branch = branch;
      }
    } else if (req.user.role === 'manager') {
      // Managers can see customers from their branch
      query.branch = req.user.branch;
    } else {
      // Regular users can only see customers assigned to them
      query.assignedTo = req.user._id;
    }

    // Recovery status filter
    if (isRecovered !== undefined) {
      query.isRecovered = isRecovered === 'true';
    }

    // Search filter
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const customers = await Customer.find(query)
      .populate('assignedTo', 'username branch role') // Populate the assignedTo field with user information
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCustomers: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if user has access to this customer's branch
    if (req.user.role !== 'admin' && customer.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Not authorized to view this customer' });
    }

    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private (Admin/Manager)
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if user has access to this customer's branch
    if (req.user.role !== 'admin' && customer.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Not authorized to update this customer' });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedCustomer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.remove();
    res.json({ message: 'Customer removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/stats/summary
// @desc    Get customer statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const query = req.user.role !== 'admin' ? { branch: req.user.branch } : {};

    const stats = await Customer.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalOutstanding: { $sum: '$outstandingBalance' },
          totalRecovered: {
            $sum: {
              $cond: [{ $eq: ['$isRecovered', true] }, '$netBalance', 0]
            }
          },
          recoveredCount: {
            $sum: {
              $cond: [{ $eq: ['$isRecovered', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalCustomers: 0,
      totalOutstanding: 0,
      totalRecovered: 0,
      recoveredCount: 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
