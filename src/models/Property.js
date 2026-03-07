const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Property description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  property_type: {
    type: String,
    required: [true, 'Property type is required'],
    enum: ['apartment', 'house', 'villa', 'condo', 'townhouse', 'commercial', 'land', 'studio']
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'rented', 'pending', 'off_market'],
    default: 'available'
  },
  bedrooms: {
    type: Number,
    required: [true, 'Number of bedrooms is required'],
    min: [0, 'Bedrooms cannot be negative']
  },
  bathrooms: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Bathrooms cannot be negative']
  },
  area: {
    type: Number,
    required: [true, 'Area is required'],
    min: [0, 'Area must be positive']
  },
  area_unit: {
    type: String,
    enum: ['sqft', 'sqm', 'sqyd', 'acre'],
    default: 'sqft'
  },
  agent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: [true, 'Agent is required']
  },
  year_built: {
    type: Number,
    min: [1800, 'Year built must be after 1800'],
    max: [new Date().getFullYear() + 1, 'Year built cannot be in the future']
  },
  parking_spaces: {
    type: Number,
    min: 0,
    default: 0
  },
  furnished: {
    type: Boolean,
    default: false
  },
  pet_friendly: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  views_count: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

propertySchema.index({ city: 1, state: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ property_type: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ agent_id: 1 });
propertySchema.index({ location: 'text', title: 'text', description: 'text' });

module.exports = mongoose.model('Property', propertySchema);
