const mongoose = require('mongoose');

const propertyAmenitySchema = new mongoose.Schema({
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  amenity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Amenity',
    required: true
  },
  added_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

propertyAmenitySchema.index({ property_id: 1, amenity_id: 1 }, { unique: true });

module.exports = mongoose.model('PropertyAmenity', propertyAmenitySchema);
