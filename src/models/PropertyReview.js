const mongoose = require('mongoose');

const propertyReviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  helpful_count: {
    type: Number,
    default: 0
  },
  response: {
    type: String,
    maxlength: [1000, 'Response cannot exceed 1000 characters']
  },
  response_date: Date,
  responded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

propertyReviewSchema.index({ user_id: 1, property_id: 1 }, { unique: true });
propertyReviewSchema.index({ property_id: 1 });
propertyReviewSchema.index({ rating: 1 });
propertyReviewSchema.index({ created_at: -1 });

module.exports = mongoose.model('PropertyReview', propertyReviewSchema);
