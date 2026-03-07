const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'login', 'logout', 'register', 'update_profile', 'delete_account',
      'create_property', 'update_property', 'delete_property', 'view_property',
      'create_inquiry', 'respond_inquiry', 'create_appointment', 'update_appointment',
      'add_favorite', 'remove_favorite', 'create_review', 'update_review', 'delete_review',
      'send_message', 'read_message', 'delete_message',
      'admin_approve_property', 'admin_reject_property', 'admin_verify_agent',
      'admin_create_user', 'admin_delete_user', 'admin_create_ad', 'admin_update_ad', 'admin_delete_ad',
      'create_blog', 'update_blog', 'delete_blog', 'approve_comment', 'reject_comment'
    ]
  },
  resource_type: {
    type: String,
    enum: ['User', 'Property', 'Inquiry', 'Appointment', 'Message', 'Review', 'Favorite', 'Agent', 'Advertisement', 'Blog', 'Comment', 'Notification'],
    required: false
  },
  resource_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  ip_address: String,
  user_agent: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

activityLogSchema.index({ user_id: 1, created_at: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resource_type: 1, resource_id: 1 });
activityLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
