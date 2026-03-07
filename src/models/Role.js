const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role_name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_system: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

roleSchema.index({ role_name: 1 });

module.exports = mongoose.model('Role', roleSchema);
