const Favorite = require('../models/Favorite');
const Property = require('../models/Property');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getFavorites = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { sort_by, property_type, min_price, max_price, city, state } = req.query;

  let matchStage = { user_id: req.user.id };
  
  let sortStage = { created_at: -1 };
  if (sort_by === 'price_low') sortStage = { 'property_id.price': 1 };
  if (sort_by === 'price_high') sortStage = { 'property_id.price': -1 };
  if (sort_by === 'newest') sortStage = { 'property_id.createdAt': -1 };
  if (sort_by === 'oldest') sortStage = { 'property_id.createdAt': 1 };

  let propertyFilter = {};
  if (property_type) propertyFilter.property_type = property_type;
  if (min_price || max_price) {
    propertyFilter.price = {};
    if (min_price) propertyFilter.price.$gte = parseFloat(min_price);
    if (max_price) propertyFilter.price.$lte = parseFloat(max_price);
  }
  if (city) propertyFilter.city = new RegExp(city, 'i');
  if (state) propertyFilter.state = new RegExp(state, 'i');

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'properties',
        localField: 'property_id',
        foreignField: '_id',
        as: 'property_id'
      }
    },
    { $unwind: '$property_id' },
    { $match: { 'property_id.isApproved': true, ...propertyFilter } },
    {
      $lookup: {
        from: 'users',
        localField: 'property_id.agent_id',
        foreignField: '_id',
        as: 'agent_info'
      }
    },
    { $unwind: '$agent_info' },
    {
      $lookup: {
        from: 'propertyimages',
        localField: 'property_id._id',
        foreignField: 'property_id',
        as: 'images'
      }
    },
    {
      $addFields: {
        'property_id.primary_image': {
          $filter: {
            input: '$images',
            cond: { $eq: ['$$this.is_primary', true] }
          }
        }
      }
    },
    {
      $addFields: {
        'property_id.primary_image': { $arrayElemAt: ['$property_id.primary_image', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        created_at: 1,
        'property_id': 1,
        'agent_info.name': 1,
        'agent_info.profile_image': 1
      }
    },
    { $sort: sortStage },
    { $skip: skip },
    { $limit: limit }
  ];

  const favorites = await Favorite.aggregate(pipeline);

  const totalPipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'properties',
        localField: 'property_id',
        foreignField: '_id',
        as: 'property_id'
      }
    },
    { $unwind: '$property_id' },
    { $match: { 'property_id.isApproved': true, ...propertyFilter } },
    { $count: 'total' }
  ];

  const totalResult = await Favorite.aggregate(totalPipeline);
  const total = totalResult[0] ? totalResult[0].total : 0;

  res.json({
    success: true,
    data: favorites,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const addToFavorites = asyncHandler(async (req, res) => {
  const { property_id } = req.body;

  const property = await Property.findById(property_id);
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  const existingFavorite = await Favorite.findOne({
    user_id: req.user.id,
    property_id
  });

  if (existingFavorite) {
    return res.status(400).json({
      success: false,
      message: 'Property already in favorites'
    });
  }

  const favorite = await Favorite.create({
    user_id: req.user.id,
    property_id
  });

  await favorite.populate({
    path: 'property_id',
    populate: [
      { path: 'agent_id', select: 'user_id' },
      { path: 'property_images', match: { is_primary: true } }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Property added to favorites',
    data: favorite
  });
});

const removeFromFavorites = asyncHandler(async (req, res) => {
  const favorite = await Favorite.findOneAndDelete({
    user_id: req.user.id,
    property_id: req.params.id
  });

  if (!favorite) {
    return res.status(404).json({
      success: false,
      message: 'Favorite not found'
    });
  }

  res.json({
    success: true,
    message: 'Property removed from favorites'
  });
});

const checkFavorite = asyncHandler(async (req, res) => {
  const { property_id } = req.params;

  const favorite = await Favorite.findOne({
    user_id: req.user.id,
    property_id
  });

  res.json({
    success: true,
    isFavorite: !!favorite,
    data: favorite
  });
});

const bulkAddToFavorites = asyncHandler(async (req, res) => {
  const { property_ids } = req.body;

  if (!property_ids || !Array.isArray(property_ids)) {
    return res.status(400).json({
      success: false,
      message: 'Property IDs array is required'
    });
  }

  const properties = await Property.find({ _id: { $in: property_ids } });
  const validPropertyIds = properties.map(p => p._id.toString());

  const existingFavorites = await Favorite.find({
    user_id: req.user.id,
    property_id: { $in: validPropertyIds }
  });

  const existingPropertyIds = existingFavorites.map(f => f.property_id.toString());
  const newPropertyIds = validPropertyIds.filter(id => !existingPropertyIds.includes(id));

  if (newPropertyIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'All properties are already in favorites'
    });
  }

  const favorites = newPropertyIds.map(property_id => ({
    user_id: req.user.id,
    property_id
  }));

  const createdFavorites = await Favorite.insertMany(favorites);

  res.status(201).json({
    success: true,
    message: `${createdFavorites.length} properties added to favorites`,
    data: createdFavorites
  });
});

const bulkRemoveFromFavorites = asyncHandler(async (req, res) => {
  const { property_ids } = req.body;

  if (!property_ids || !Array.isArray(property_ids)) {
    return res.status(400).json({
      success: false,
      message: 'Property IDs array is required'
    });
  }

  const result = await Favorite.deleteMany({
    user_id: req.user.id,
    property_id: { $in: property_ids }
  });

  res.json({
    success: true,
    message: `${result.deletedCount} properties removed from favorites`,
    deletedCount: result.deletedCount
  });
});

const getFavoriteStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const totalFavorites = await Favorite.countDocuments({ user_id: userId });

  const propertyTypeStats = await Favorite.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'properties',
        localField: 'property_id',
        foreignField: '_id',
        as: 'property'
      }
    },
    { $unwind: '$property' },
    { $match: { 'property.isApproved': true } },
    {
      $group: {
        _id: '$property.property_type',
        count: { $sum: 1 },
        avgPrice: { $avg: '$property.price' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const priceRangeStats = await Favorite.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'properties',
        localField: 'property_id',
        foreignField: '_id',
        as: 'property'
      }
    },
    { $unwind: '$property' },
    { $match: { 'property.isApproved': true } },
    {
      $bucket: {
        groupBy: '$property.price',
        boundaries: [0, 100000, 250000, 500000, 1000000, Infinity],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          prices: { $push: '$property.price' }
        }
      }
    }
  ]);

  const recentFavorites = await Favorite.find({ user_id: userId })
    .populate({
      path: 'property_id',
      select: 'title price location',
      match: { isApproved: true }
    })
    .sort({ created_at: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      totalFavorites,
      propertyTypeStats,
      priceRangeStats,
      recentFavorites: recentFavorites.filter(fav => fav.property_id)
    }
  });
});

const shareFavorites = asyncHandler(async (req, res) => {
  const { property_ids, message } = req.body;

  if (!property_ids || !Array.isArray(property_ids)) {
    return res.status(400).json({
      success: false,
      message: 'Property IDs array is required'
    });
  }

  const favorites = await Favorite.find({
    user_id: req.user.id,
    property_id: { $in: property_ids }
  }).populate({
    path: 'property_id',
    select: 'title price location property_images',
    populate: { path: 'property_images', match: { is_primary: true } }
  });

  const shareToken = crypto.randomBytes(32).toString('hex');
  const shareData = {
    token: shareToken,
    user_id: req.user.id,
    property_ids,
    message,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };

  res.json({
    success: true,
    message: 'Share link generated successfully',
    shareToken,
    shareUrl: `${process.env.FRONTEND_URL}/shared-favorites/${shareToken}`,
    data: favorites.filter(fav => fav.property_id)
  });
});

module.exports = {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  bulkAddToFavorites,
  bulkRemoveFromFavorites,
  getFavoriteStats,
  shareFavorites
};
