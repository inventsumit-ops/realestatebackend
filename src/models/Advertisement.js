const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Advertisement title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  image: {
    type: String,
    required: [true, 'Advertisement image is required']
  },
  image_key: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: [true, 'Advertisement link is required']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  ad_type: {
    type: String,
    enum: ['banner', 'sidebar', 'popup', 'featured_agent'],
    default: 'banner'
  },
  position: {
    type: String,
    enum: ['home_top', 'home_middle', 'home_bottom', 'search_sidebar', 'property_detail'],
    default: 'home_top'
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  },
  clicks: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
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
  advertiser_name: {
    type: String,
    required: [true, 'Advertiser name is required']
  },
  advertiser_email: {
    type: String,
    required: [true, 'Advertiser email is required']
  },
  target_audience: [{
    type: String,
    enum: ['buyers', 'sellers', 'renters', 'agents']
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

advertisementSchema.index({ status: 1 });
advertisementSchema.index({ ad_type: 1 });
advertisementSchema.index({ position: 1 });
advertisementSchema.index({ start_date: 1, end_date: 1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
