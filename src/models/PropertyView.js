const mongoose = require('mongoose');

const propertyViewSchema = new mongoose.Schema({
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  view_date: {
    type: Date,
    default: Date.now
  },
  ip_address: String,
  user_agent: String,
  session_id: String,
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

propertyViewSchema.index({ property_id: 1, view_date: -1 });
propertyViewSchema.index({ user_id: 1, view_date: -1 });

module.exports = mongoose.model('PropertyView', propertyViewSchema);
