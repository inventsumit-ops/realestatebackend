const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['inquiry', 'appointment', 'message', 'property_update', 'system', 'marketing', 'review'],
    required: true
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: Date,
  related_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  related_model: {
    type: String,
    enum: ['Property', 'Inquiry', 'Appointment', 'Message', 'Review'],
    required: false
  },
  action_url: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expires_at: Date,
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: Date
}, {
  timestamps: true
});

notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expires_at: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
