const express = require('express');
const router = express.Router();
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAgentAvailability,
  getAppointmentStats,
  rescheduleAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAppointments);
router.get('/stats', getAppointmentStats);
router.get('/availability', getAgentAvailability);
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);
router.put('/:id/reschedule', rescheduleAppointment);

module.exports = router;
