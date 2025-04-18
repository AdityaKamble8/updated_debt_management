const Visit = require('../models/Visit');

exports.createVisit = async (req, res) => {
  try {
    const { feedbackText } = req.body;
    const customerId = req.body.customerId;
    
    if (!feedbackText || !customerId) {
      return res.status(400).json({ message: 'Please provide feedback text and customer ID' });
    }

    const newVisit = new Visit({
      user: req.user.id,
      customer: customerId,
      feedbackText,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      location: req.body.location || { coordinates: [0, 0] }
    });

    const savedVisit = await newVisit.save();
    res.status(201).json(savedVisit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomerVisits = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { customer: customerId };
    if (startDate && endDate) {
      query.visitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const visits = await Visit.find(query)
      .populate('user', 'name email')
      .sort({ visitDate: -1 });

    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVisitsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { user: userId };
    if (startDate && endDate) {
      query.visitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const visits = await Visit.find(query)
      .populate('customer', 'name phone')
      .sort({ visitDate: -1 });

    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};