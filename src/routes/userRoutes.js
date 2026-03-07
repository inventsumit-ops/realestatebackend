const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  getAppointments,
  createAppointment,
  getInquiries,
  createReview,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  uploadProfileImage
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

router.post('/profile-image', uploadProfileImage);

router.get('/favorites/list', getFavorites);
router.post('/favorites', addToFavorites);
router.delete('/favorites/:id', removeFromFavorites);

router.get('/appointments/list', getAppointments);
router.post('/appointments', createAppointment);

router.get('/inquiries/list', getInquiries);
router.post('/reviews', createReview);

router.get('/notifications/list', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);
router.put('/notifications/read-all', markAllNotificationsAsRead);

module.exports = router;
