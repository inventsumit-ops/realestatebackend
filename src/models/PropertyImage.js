const mongoose = require('mongoose');

const propertyImageSchema = new mongoose.Schema({
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  image_url: {
    type: String,
    required: [true, 'Image URL is required']
  },
  image_key: {
    type: String,
    required: true
  },
  is_primary: {
    type: Boolean,
    default: false
  },
  alt_text: {
    type: String,
    maxlength: [200, 'Alt text cannot exceed 200 characters']
  },
  file_size: {
    type: Number,
    required: true
  },
  file_type: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  upload_date: {
    type: Date,
    default: Date.now
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

propertyImageSchema.index({ property_id: 1 });
propertyImageSchema.index({ is_primary: 1 });

module.exports = mongoose.model('PropertyImage', propertyImageSchema);
