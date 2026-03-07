const express = require('express');
const router = express.Router();
const {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  searchProperties,
  getFeaturedProperties,
  getLatestProperties,
  uploadPropertyImages,
  uploadPropertyVideos,
  addPropertyAmenities,
  getPropertyReviews,
  createPropertyReview,
  contactAgent
} = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getProperties);
router.get('/search', searchProperties);
router.get('/featured', getFeaturedProperties);
router.get('/latest', getLatestProperties);
router.get('/:id', getPropertyById);

router.use(protect);

router.post('/', authorize('agent', 'admin'), createProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

router.post('/:id/images', uploadPropertyImages);
router.post('/:id/videos', uploadPropertyVideos);
router.post('/:id/amenities', addPropertyAmenities);

router.get('/:id/reviews', getPropertyReviews);
router.post('/:id/reviews', createPropertyReview);

router.post('/:id/contact', contactAgent);

module.exports = router;
