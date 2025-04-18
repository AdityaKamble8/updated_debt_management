const express = require('express');
const router = express.Router();
const multer = require('multer');
const visitController = require('../controllers/visitcontroller');
const { protect, authorize } = require('../middleware/auth.middleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.post('/', protect, upload.single('image'), visitController.createVisit);
router.get('/:customerId', protect, visitController.getCustomerVisits);
router.get('/user/:userId', protect, authorize('admin'), visitController.getVisitsByUser);

module.exports = router;
