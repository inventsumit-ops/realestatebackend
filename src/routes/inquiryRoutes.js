const express = require('express');
const router = express.Router();
const {
  getInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  getInquiryStats,
  bulkUpdateInquiries
} = require('../controllers/inquiryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getInquiries);
router.get('/stats', getInquiryStats);
router.get('/:id', getInquiryById);
router.post('/', createInquiry);
router.put('/:id', updateInquiry);
router.delete('/:id', deleteInquiry);
router.put('/bulk-update', bulkUpdateInquiries);

module.exports = router;
