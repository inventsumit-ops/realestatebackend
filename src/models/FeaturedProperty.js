const mongoose = require('mongoose');

const featuredPropertySchema = new mongoose.Schema({
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  },
  featured_type: {
    type: String,
    enum: ['home_page', 'category_page', 'search_results', 'premium_listing'],
    default: 'home_page'
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  is_active: {
    type: Boolean,
    default: true
  },
  cost: {
    type: Number,
    required: true
  },
  paid: {
    type: Boolean,
    default: false
  },
  payment_date: Date,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

featuredPropertySchema.index({ property_id: 1 });
featuredPropertySchema.index({ start_date: 1, end_date: 1 });
featuredPropertySchema.index({ featured_type: 1 });
featuredPropertySchema.index({ is_active: 1 });

module.exports = mongoose.model('FeaturedProperty', featuredPropertySchema);
