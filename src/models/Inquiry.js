const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
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
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'responded', 'closed'],
    default: 'pending'
  },
  agent_response: {
    type: String,
    maxlength: [1000, 'Response cannot exceed 1000 characters']
  },
  responded_at: Date,
  responded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  contact_method: {
    type: String,
    enum: ['email', 'phone', 'both'],
    default: 'email'
  },
  preferred_contact_time: String
}, {
  timestamps: true
});

inquirySchema.index({ user_id: 1 });
inquirySchema.index({ property_id: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ created_at: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
