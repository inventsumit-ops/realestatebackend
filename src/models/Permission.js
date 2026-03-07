const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  permission_name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Permission name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    trim: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['create', 'read', 'update', 'delete', 'manage', 'approve', 'verify']
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

permissionSchema.index({ permission_name: 1 });
permissionSchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
