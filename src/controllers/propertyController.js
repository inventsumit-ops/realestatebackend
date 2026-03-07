const Property = require('../models/Property');
const PropertyImage = require('../models/PropertyImage');
const PropertyVideo = require('../models/PropertyVideo');
const PropertyAmenity = require('../models/PropertyAmenity');
const PropertyReview = require('../models/PropertyReview');
const PropertyView = require('../models/PropertyView');
const Amenity = require('../models/Amenity');
const Favorite = require('../models/Favorite');
const Inquiry = require('../models/Inquiry');
const { asyncHandler } = require('../middleware/errorMiddleware');

const createProperty = asyncHandler(async (req, res) => {
  const propertyData = req.body;
  
  if (req.user.role !== 'agent' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only agents can create properties'
    });
  }

  const property = await Property.create({
    ...propertyData,
    agent_id: req.user.role === 'agent' ? req.user.id : propertyData.agent_id
  });

  await property.populate([
    { path: 'agent_id', populate: { path: 'user_id', select: 'name email' } }
  ]);

  res.status(201).json({
    success: true,
    message: 'Property created successfully',
    data: property
  });
});

const getProperties = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const {
    property_type,
    status,
    min_price,
    max_price,
    bedrooms,
    bathrooms,
    city,
    state,
    featured,
    agent_id,
    search
  } = req.query;

  const filter = { isApproved: true };
  
  if (property_type) filter.property_type = property_type;
  if (status) filter.status = status;
  if (city) filter.city = new RegExp(city, 'i');
  if (state) filter.state = new RegExp(state, 'i');
  if (featured) filter.featured = featured === 'true';
  if (agent_id) filter.agent_id = agent_id;
  
  if (min_price || max_price) {
    filter.price = {};
    if (min_price) filter.price.$gte = parseFloat(min_price);
    if (max_price) filter.price.$lte = parseFloat(max_price);
  }
  
  if (bedrooms) filter.bedrooms = parseInt(bedrooms);
  if (bathrooms) filter.bathrooms = parseInt(bathrooms);
  
  if (search) {
    filter.$text = { $search: search };
  }

  const properties = await Property.find(filter)
    .populate([
      { path: 'agent_id', populate: { path: 'user_id', select: 'name profile_image' } },
      { path: 'property_images', match: { is_primary: true } }
    ])
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments(filter);

  res.json({
    success: true,
    data: properties,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate([
      { path: 'agent_id', populate: { path: 'user_id', select: 'name email profile_image phone' } },
      { path: 'property_images' },
      { path: 'property_videos' },
      {
        path: 'property_amenities',
        populate: { path: 'amenity_id' }
      }
    ]);

  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  await PropertyView.create({
    property_id: property._id,
    user_id: req.user ? req.user.id : null,
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  });

  property.views_count += 1;
  await property.save();

  const reviews = await PropertyReview.find({ property_id: property._id })
    .populate({ path: 'user_id', select: 'name profile_image' })
    .sort({ created_at: -1 });

  const isFavorite = req.user ? await Favorite.findOne({
    user_id: req.user.id,
    property_id: property._id
  }) : null;

  res.json({
    success: true,
    data: {
      ...property.toObject(),
      reviews,
      isFavorite: !!isFavorite
    }
  });
});

const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  if (req.user.role !== 'admin' && property.agent_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this property'
    });
  }

  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate([
    { path: 'agent_id', populate: { path: 'user_id', select: 'name email' } }
  ]);

  res.json({
    success: true,
    message: 'Property updated successfully',
    data: updatedProperty
  });
});

const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  if (req.user.role !== 'admin' && property.agent_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this property'
    });
  }

  await Property.findByIdAndDelete(req.params.id);
  await PropertyImage.deleteMany({ property_id: req.params.id });
  await PropertyVideo.deleteMany({ property_id: req.params.id });
  await PropertyAmenity.deleteMany({ property_id: req.params.id });
  await PropertyReview.deleteMany({ property_id: req.params.id });
  await Favorite.deleteMany({ property_id: req.params.id });
  await Inquiry.deleteMany({ property_id: req.params.id });

  res.json({
    success: true,
    message: 'Property deleted successfully'
  });
});

const searchProperties = asyncHandler(async (req, res) => {
  const { query, filters } = req.body;
  
  const searchFilter = { isApproved: true };
  
  if (query) {
    searchFilter.$text = { $search: query };
  }
  
  if (filters) {
    if (filters.property_type) searchFilter.property_type = { $in: filters.property_type };
    if (filters.price_range) {
      searchFilter.price = {
        $gte: filters.price_range.min,
        $lte: filters.price_range.max
      };
    }
    if (filters.bedrooms) searchFilter.bedrooms = { $gte: filters.bedrooms };
    if (filters.bathrooms) searchFilter.bathrooms = { $gte: filters.bathrooms };
    if (filters.area) searchFilter.area = { $gte: filters.area };
    if (filters.city) searchFilter.city = new RegExp(filters.city, 'i');
    if (filters.state) searchFilter.state = new RegExp(filters.state, 'i');
    if (filters.amenities && filters.amenities.length > 0) {
      const propertiesWithAmenities = await PropertyAmenity.find({
        amenity_id: { $in: filters.amenities }
      }).distinct('property_id');
      searchFilter._id = { $in: propertiesWithAmenities };
    }
  }

  const properties = await Property.find(searchFilter)
    .populate([
      { path: 'agent_id', populate: { path: 'user_id', select: 'name profile_image' } },
      { path: 'property_images', match: { is_primary: true } }
    ])
    .limit(50)
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 });

  res.json({
    success: true,
    data: properties
  });
});

const getFeaturedProperties = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const properties = await Property.find({ 
    featured: true, 
    isApproved: true, 
    status: 'available' 
  })
    .populate([
      { path: 'agent_id', populate: { path: 'user_id', select: 'name profile_image' } },
      { path: 'property_images', match: { is_primary: true } }
    ])
    .limit(limit)
    .sort({ views_count: -1 });

  res.json({
    success: true,
    data: properties
  });
});

const getLatestProperties = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const properties = await Property.find({ 
    isApproved: true, 
    status: 'available' 
  })
    .populate([
      { path: 'agent_id', populate: { path: 'user_id', select: 'name profile_image' } },
      { path: 'property_images', match: { is_primary: true } }
    ])
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: properties
  });
});

const uploadPropertyImages = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  if (req.user.role !== 'admin' && property.agent_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to upload images for this property'
    });
  }

  const { images } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image URLs provided'
    });
  }

  const imagePromises = images.map(async (imageData, index) => {
    const { url, key, file_size, file_type, alt_text } = imageData;
    
    if (!url || !key) {
      throw new Error('Each image must have url and key');
    }

    return await PropertyImage.create({
      property_id: property._id,
      image_url: url,
      image_key: key,
      file_size: file_size || 0,
      file_type: file_type || 'image/jpeg',
      alt_text: alt_text || '',
      is_primary: index === 0 && (await PropertyImage.countDocuments({ property_id: property._id })) === 0,
      order: index
    });
  });

  const savedImages = await Promise.all(imagePromises);

  res.status(201).json({
    success: true,
    message: 'Images uploaded successfully',
    data: savedImages
  });
});

const addPropertyAmenities = asyncHandler(async (req, res) => {
  const { amenity_ids } = req.body;
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  if (req.user.role !== 'admin' && property.agent_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this property'
    });
  }

  const amenities = amenity_ids.map(amenity_id => ({
    property_id: property._id,
    amenity_id
  }));

  await PropertyAmenity.deleteMany({ property_id: property._id });
  const propertyAmenities = await PropertyAmenity.insertMany(amenities);

  res.status(201).json({
    success: true,
    message: 'Amenities added successfully',
    data: propertyAmenities
  });
});

const getPropertyReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await PropertyReview.find({ property_id: req.params.id })
    .populate({ path: 'user_id', select: 'name profile_image' })
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 });

  const total = await PropertyReview.countDocuments({ property_id: req.params.id });

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const createPropertyReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const existingReview = await PropertyReview.findOne({
    user_id: req.user.id,
    property_id: req.params.id
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this property'
    });
  }

  const review = await PropertyReview.create({
    user_id: req.user.id,
    property_id: req.params.id,
    rating,
    comment
  });

  await review.populate({ path: 'user_id', select: 'name profile_image' });

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review
  });
});

const uploadPropertyVideos = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  if (req.user.role !== 'admin' && property.agent_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to upload videos for this property'
    });
  }

  const { videos } = req.body;

  if (!videos || !Array.isArray(videos) || videos.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No video URLs provided'
    });
  }

  const videoPromises = videos.map(async (videoData, index) => {
    const { url, key, title, description, file_size, file_type, duration, thumbnail_url } = videoData;
    
    if (!url || !key) {
      throw new Error('Each video must have url and key');
    }

    return await PropertyVideo.create({
      property_id: property._id,
      video_url: url,
      video_key: key,
      title: title || '',
      description: description || '',
      file_size: file_size || 0,
      file_type: file_type || 'video/mp4',
      duration: duration || 0,
      thumbnail_url: thumbnail_url || '',
      is_featured: index === 0
    });
  });

  const savedVideos = await Promise.all(videoPromises);

  res.status(201).json({
    success: true,
    message: 'Videos uploaded successfully',
    data: savedVideos
  });
});

const contactAgent = asyncHandler(async (req, res) => {
  const { message, contact_method, preferred_contact_time } = req.body;
  const property = await Property.findById(req.params.id).populate('agent_id');

  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  const inquiry = await Inquiry.create({
    user_id: req.user.id,
    property_id: property._id,
    message,
    contact_method: contact_method || 'email',
    preferred_contact_time
  });

  await inquiry.populate([
    { path: 'user_id', select: 'name email phone' },
    { path: 'property_id', select: 'title' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Inquiry sent successfully',
    data: inquiry
  });
});

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  searchProperties,
  getFeaturedProperties,
  getLatestProperties,
  uploadPropertyImages,
  uploadPropertyVideos,
  addPropertyAmenities,
  getPropertyReviews,
  createPropertyReview,
  contactAgent
};
