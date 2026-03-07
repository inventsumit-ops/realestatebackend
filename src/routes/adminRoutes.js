const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUsers,
  createUser,
  deleteUser,
  getProperties,
  createProperty,
  approveProperty,
  rejectProperty,
  deleteProperty,
  getAgents,
  createAgent,
  verifyAgent,
  getInquiries,
  createInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getReports,
  getAnalytics,
  getLogs,
  createAdvertisement,
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  createBlog,
  getBlogs,
  updateBlog,
  deleteBlog,
  getSettings,
  updateSettings
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboard);

router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

router.get('/properties', getProperties);
router.post('/properties', createProperty);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);
router.delete('/properties/:id', deleteProperty);

router.get('/agents', getAgents);
router.post('/agents', createAgent);
router.put('/agents/:id/verify', verifyAgent);

router.get('/inquiries', getInquiries);
router.post('/inquiries', createInquiry);
router.put('/inquiries/:id/status', updateInquiryStatus);
router.delete('/inquiries/:id', deleteInquiry);

router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);
router.put('/appointments/:id/status', updateAppointmentStatus);
router.delete('/appointments/:id', deleteAppointment);

router.get('/reports', getReports);
router.get('/analytics', getAnalytics);
router.get('/logs', getLogs);

router.post('/ads', createAdvertisement);
router.get('/ads', getAdvertisements);
router.put('/ads/:id', updateAdvertisement);
router.delete('/ads/:id', deleteAdvertisement);

router.post('/blogs', createBlog);
router.get('/blogs', getBlogs);
router.put('/blogs/:id', updateBlog);
router.delete('/blogs/:id', deleteBlog);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
