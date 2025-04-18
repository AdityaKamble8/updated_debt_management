const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const visitRoutes = require('./routes/visitRoutes');

require('dotenv').config();

const createAdminUser = require('./utils/createAdmin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/visits', visitRoutes);
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    // Create admin user after successful database connection
    await createAdminUser();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const customerLocationRoutes = require('./routes/customer.location');
const recoveryRoutes = require('./routes/recovery.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customers', customerLocationRoutes);
app.use('/api/recovery', recoveryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
