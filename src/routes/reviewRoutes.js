const express = require('express');
const router = express.Router();
const {
  getPropertyReviews,
  createPropertyReview,
  updatePropertyReview,
  deletePropertyReview,
  markReviewHelpful,
  respondToPropertyReview,
  getAgentReviews,
  createAgentReview,
  updateAgentReview,
  deleteAgentReview,
  getMyReviews
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my-reviews', protect, getMyReviews);

router.get('/properties/:id', getPropertyReviews);
router.post('/properties/:id', protect, createPropertyReview);
router.put('/properties/:id', protect, updatePropertyReview);
router.delete('/properties/:id', protect, deletePropertyReview);
router.put('/properties/:id/helpful', protect, markReviewHelpful);
router.post('/properties/:id/respond', protect, respondToPropertyReview);

router.get('/agents/:id', getAgentReviews);
router.post('/agents/:id', protect, createAgentReview);
router.put('/agents/:id', protect, updateAgentReview);
router.delete('/agents/:id', protect, deleteAgentReview);

module.exports = router;
