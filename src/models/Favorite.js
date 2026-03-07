const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

favoriteSchema.index({ user_id: 1, property_id: 1 }, { unique: true });
favoriteSchema.index({ user_id: 1 });
favoriteSchema.index({ property_id: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
