const mongoose = require('mongoose');

const agentReviewSchema = new mongoose.Schema({
  agent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  review: {
    type: String,
    required: [true, 'Review is required'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  communication_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  professionalism_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  knowledge_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  helpful_count: {
    type: Number,
    default: 0
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  agent_response: {
    type: String,
    maxlength: [1000, 'Response cannot exceed 1000 characters']
  },
  response_date: Date
}, {
  timestamps: true
});

agentReviewSchema.index({ agent_id: 1, user_id: 1 }, { unique: true });
agentReviewSchema.index({ agent_id: 1 });
agentReviewSchema.index({ rating: 1 });
agentReviewSchema.index({ created_at: -1 });

module.exports = mongoose.model('AgentReview', agentReviewSchema);
