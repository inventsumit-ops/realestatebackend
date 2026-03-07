const mongoose = require('mongoose');

const blogCommentSchema = new mongoose.Schema({
  blog_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  parent_comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogComment',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  likes: {
    type: Number,
    default: 0
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: Date,
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

blogCommentSchema.index({ blog_id: 1 });
blogCommentSchema.index({ user_id: 1 });
blogCommentSchema.index({ parent_comment: 1 });
blogCommentSchema.index({ status: 1 });
blogCommentSchema.index({ created_at: -1 });

module.exports = mongoose.model('BlogComment', blogCommentSchema);
