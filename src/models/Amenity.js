const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Amenity name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  icon: {
    type: String,
    required: [true, 'Icon is required']
  },
  category: {
    type: String,
    enum: ['general', 'safety', 'entertainment', 'outdoor', 'kitchen', 'bathroom', 'laundry', 'heating_cooling'],
    default: 'general'
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

amenitySchema.index({ name: 1 });
amenitySchema.index({ category: 1 });

module.exports = mongoose.model('Amenity', amenitySchema);
