const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  agent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  appointment_date: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  duration: {
    type: Number,
    default: 60,
    min: [15, 'Duration must be at least 15 minutes']
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  cancellation_reason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancelled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelled_at: Date,
  reminder_sent: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  },
  feedback_rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

appointmentSchema.index({ user_id: 1 });
appointmentSchema.index({ agent_id: 1 });
appointmentSchema.index({ property_id: 1 });
appointmentSchema.index({ appointment_date: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
