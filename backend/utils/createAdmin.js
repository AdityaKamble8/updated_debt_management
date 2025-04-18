const User = require('../models/user.model');

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin@123', // This will be hashed automatically by the User model
        role: 'admin',
        branch: 'HEAD_OFFICE'
      });

      await admin.save();
      console.log('Admin user created successfully');
      console.log('Username: admin');
      console.log('Password: admin@123');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

module.exports = createAdminUser;
