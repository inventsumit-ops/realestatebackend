const express = require('express');
const router = express.Router();
const {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  bulkAddToFavorites,
  bulkRemoveFromFavorites,
  getFavoriteStats,
  shareFavorites
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getFavorites);
router.get('/stats', getFavoriteStats);
router.post('/', addToFavorites);
router.delete('/:id', removeFromFavorites);
router.get('/check/:property_id', checkFavorite);
router.post('/bulk-add', bulkAddToFavorites);
router.post('/bulk-remove', bulkRemoveFromFavorites);
router.post('/share', shareFavorites);

module.exports = router;
