const Amenity = require('../models/Amenity');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get all amenities with pagination and filtering
// @route   GET /api/admin/amenities
// @access  Private/Admin
const getAmenities = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const category = req.query.category || '';
  const status = req.query.status || '';

  // Build query
  const query = {};

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by status
  if (status === 'active') {
    query.is_active = true;
  } else if (status === 'inactive') {
    query.is_active = false;
  }

  // Get total count
  const total = await Amenity.countDocuments(query);

  // Get amenities with pagination
  const amenities = await Amenity.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    success: true,
    data: amenities,
    pagination: {
      current: page,
      pageSize: limit,
      total: total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single amenity by ID
// @route   GET /api/admin/amenities/:id
// @access  Private/Admin
const getAmenityById = asyncHandler(async (req, res) => {
  const amenity = await Amenity.findById(req.params.id);

  if (!amenity) {
    return res.status(404).json({
      success: false,
      message: 'Amenity not found'
    });
  }

  res.json({
    success: true,
    data: amenity
  });
});

// @desc    Create new amenity
// @route   POST /api/admin/amenities
// @access  Private/Admin
const createAmenity = asyncHandler(async (req, res) => {
  const { name, description, category, icon, isActive } = req.body;

  // Check if amenity already exists
  const existingAmenity = await Amenity.findOne({ name });
  if (existingAmenity) {
    return res.status(400).json({
      success: false,
      message: 'Amenity with this name already exists'
    });
  }

  // Create amenity
  const amenity = await Amenity.create({
    name,
    description,
    category: category || 'general',
    icon: icon || '🏠',
    is_active: isActive !== false // Default to true
  });

  res.status(201).json({
    success: true,
    data: amenity,
    message: 'Amenity created successfully'
  });
});

// @desc    Update amenity
// @route   PUT /api/admin/amenities/:id
// @access  Private/Admin
const updateAmenity = asyncHandler(async (req, res) => {
  const { name, description, category, icon, isActive } = req.body;

  const amenity = await Amenity.findById(req.params.id);

  if (!amenity) {
    return res.status(404).json({
      success: false,
      message: 'Amenity not found'
    });
  }

  // Check if name is being changed and if it already exists
  if (name && name !== amenity.name) {
    const existingAmenity = await Amenity.findOne({ name });
    if (existingAmenity) {
      return res.status(400).json({
        success: false,
        message: 'Amenity with this name already exists'
      });
    }
  }

  // Update fields
  if (name) amenity.name = name;
  if (description !== undefined) amenity.description = description;
  if (category) amenity.category = category;
  if (icon !== undefined) amenity.icon = icon;
  if (isActive !== undefined) amenity.is_active = isActive;

  await amenity.save();

  res.json({
    success: true,
    data: amenity,
    message: 'Amenity updated successfully'
  });
});

// @desc    Delete amenity
// @route   DELETE /api/admin/amenities/:id
// @access  Private/Admin
const deleteAmenity = asyncHandler(async (req, res) => {
  const amenity = await Amenity.findById(req.params.id);

  if (!amenity) {
    return res.status(404).json({
      success: false,
      message: 'Amenity not found'
    });
  }

  await amenity.deleteOne();

  res.json({
    success: true,
    message: 'Amenity deleted successfully'
  });
});

module.exports = {
  getAmenities,
  getAmenityById,
  createAmenity,
  updateAmenity,
  deleteAmenity
};
