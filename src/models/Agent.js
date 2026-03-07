const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  license_number: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true
  },
  agency_name: {
    type: String,
    required: [true, 'Agency name is required'],
    trim: true,
    maxlength: [200, 'Agency name cannot exceed 200 characters']
  },
  experience_years: {
    type: Number,
    required: [true, 'Experience years is required'],
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },
  verified: {
    type: Boolean,
    default: false
  },
  verification_date: Date,
  verification_documents: [{
    document_url: String,
    document_key: String,
    document_type: String,
    upload_date: {
      type: Date,
      default: Date.now
    }
  }],
  specialties: [{
    type: String,
    enum: ['residential', 'commercial', 'luxury', 'rental', 'investment', 'new_construction']
  }],
  languages: [{
    type: String,
    maxlength: [50, 'Language name cannot exceed 50 characters']
  }],
  service_areas: [{
    city: String,
    state: String,
    country: String
  }],
  commission_rate: {
    type: Number,
    min: 0,
    max: 100
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  achievements: [{
    title: String,
    year: Number,
    description: String
  }],
  social_links: {
    website: String,
    linkedin: String,
    facebook: String,
    instagram: String,
    twitter: String
  },
  response_time: {
    type: String,
    enum: ['within_1_hour', 'within_2_hours', 'within_4_hours', 'within_24_hours', 'within_48_hours'],
    default: 'within_24_hours'
  },
  availability: {
    monday: { open: String, close: String, available: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, available: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, available: { type: Boolean, default: true } },
    thursday: { open: String, close: String, available: { type: Boolean, default: true } },
    friday: { open: String, close: String, available: { type: Boolean, default: true } },
    saturday: { open: String, close: String, available: { type: Boolean, default: false } },
    sunday: { open: String, close: String, available: { type: Boolean, default: false } }
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  total_sales: {
    type: Number,
    default: 0
  },
  total_properties_sold: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

agentSchema.index({ user_id: 1 });
agentSchema.index({ license_number: 1 });
agentSchema.index({ agency_name: 1 });
agentSchema.index({ verified: 1 });
agentSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Agent', agentSchema);
