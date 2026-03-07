const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'file', 'property_share'],
    default: 'text'
  },
  attachment_url: String,
  attachment_name: String,
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: Date,
  conversation_id: {
    type: String,
    required: true
  },
  is_deleted_by_sender: {
    type: Boolean,
    default: false
  },
  is_deleted_by_receiver: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

messageSchema.index({ conversation_id: 1, created_at: 1 });
messageSchema.index({ sender_id: 1 });
messageSchema.index({ receiver_id: 1 });
messageSchema.index({ is_read: 1 });

module.exports = mongoose.model('Message', messageSchema);
