const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: [true, 'Blog content is required']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  featured_image: {
    type: String
  },
  featured_image_key: String,
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogCategory',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  published_at: Date,
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  seo_title: String,
  seo_description: String,
  seo_keywords: [String],
  reading_time: {
    type: Number,
    min: 1
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  featured_until: Date
}, {
  timestamps: true
});

blogSchema.index({ slug: 1 });
blogSchema.index({ author_id: 1 });
blogSchema.index({ category_id: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ published_at: -1 });
blogSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Blog', blogSchema);
