const mongoose = require('mongoose');

const propertyVideoSchema = new mongoose.Schema({
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  video_url: {
    type: String,
    required: [true, 'Video URL is required']
  },
  video_key: {
    type: String,
    required: true
  },
  title: {
    type: String,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  file_size: {
    type: Number,
    required: true
  },
  file_type: {
    type: String,
    required: true,
    enum: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
  },
  duration: {
    type: Number,
    min: 0
  },
  thumbnail_url: String,
  upload_date: {
    type: Date,
    default: Date.now
  },
  is_featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

propertyVideoSchema.index({ property_id: 1 });

module.exports = mongoose.model('PropertyVideo', propertyVideoSchema);
