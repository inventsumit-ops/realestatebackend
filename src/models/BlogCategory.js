const mongoose = require('mongoose');

const blogCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  parent_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogCategory',
    default: null
  },
  image: String,
  image_key: String,
  is_active: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

blogCategorySchema.index({ slug: 1 });
blogCategorySchema.index({ parent_category: 1 });
blogCategorySchema.index({ is_active: 1 });

module.exports = mongoose.model('BlogCategory', blogCategorySchema);
