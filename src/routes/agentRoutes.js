const express = require('express');
const router = express.Router();
const {
  registerAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  getAgentProperties,
  getAgentReviews,
  createAgentReview,
  getAgentAppointments,
  getAgentInquiries,
  verifyAgent,
  uploadVerificationDocuments,
  getTopAgents,
  getAgentStats
} = require('../controllers/agentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getAgents);
router.get('/top', getTopAgents);
router.get('/:id', getAgentById);
router.get('/:id/properties', getAgentProperties);
router.get('/:id/reviews', getAgentReviews);
router.get('/:id/appointments', getAgentAppointments);
router.get('/:id/inquiries', getAgentInquiries);
router.get('/:id/stats', getAgentStats);

router.use(protect);

router.post('/register', authorize('agent'), registerAgent);
router.put('/:id', updateAgent);
router.delete('/:id', authorize('admin'), deleteAgent);

router.post('/:id/reviews', createAgentReview);
router.post('/:id/verify', authorize('admin'), verifyAgent);
router.post('/:id/documents', uploadVerificationDocuments);

module.exports = router;
