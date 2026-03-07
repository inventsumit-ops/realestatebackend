const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters']
  },
  country: {
    type: String,
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters']
  },
  zip_code: {
    type: String,
    trim: true,
    match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid zip code']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  date_of_birth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  preferred_language: {
    type: String,
    default: 'english'
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
