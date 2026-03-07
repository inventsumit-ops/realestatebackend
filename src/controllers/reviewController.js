const PropertyReview = require('../models/PropertyReview');
const AgentReview = require('../models/AgentReview');
const Property = require('../models/Property');
const Agent = require('../models/Agent');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getPropertyReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { rating, is_verified, sort_by } = req.query;

  let filter = { property_id: req.params.id };
  
  if (rating) {
    const ratings = Array.isArray(rating) ? rating : [rating];
    filter.rating = { $in: ratings.map(r => parseInt(r)) };
  }
  if (is_verified !== undefined) filter.is_verified = is_verified === 'true';

  let sort = { created_at: -1 };
  if (sort_by === 'rating_high') sort = { rating: -1, created_at: -1 };
  if (sort_by === 'rating_low') sort = { rating: 1, created_at: -1 };
  if (sort_by === 'helpful') sort = { helpful_count: -1, created_at: -1 };

  const reviews = await PropertyReview.find(filter)
    .populate({ path: 'user_id', select: 'name profile_image' })
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await PropertyReview.countDocuments(filter);

  const ratingStats = await PropertyReview.aggregate([
    { $match: { property_id: mongoose.Types.ObjectId(req.params.id) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    stats: ratingStats[0] || {
      averageRating: 0,
      totalReviews: 0,
      rating1: 0,
      rating2: 0,
      rating3: 0,
      rating4: 0,
      rating5: 0
    }
  });
});

const createPropertyReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

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

const updatePropertyReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const review = await PropertyReview.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  if (review.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this review'
    });
  }

  const updatedReview = await PropertyReview.findByIdAndUpdate(
    req.params.id,
    { rating, comment },
    { new: true, runValidators: true }
  ).populate({ path: 'user_id', select: 'name profile_image' });

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: updatedReview
  });
});

const deletePropertyReview = asyncHandler(async (req, res) => {
  const review = await PropertyReview.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  if (review.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }

  await PropertyReview.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

const markReviewHelpful = asyncHandler(async (req, res) => {
  const review = await PropertyReview.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  review.helpful_count += 1;
  await review.save();

  res.json({
    success: true,
    message: 'Review marked as helpful',
    data: { helpful_count: review.helpful_count }
  });
});

const respondToPropertyReview = asyncHandler(async (req, res) => {
  const { response } = req.body;

  const review = await PropertyReview.findById(req.params.id).populate('property_id');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  const property = await Property.findById(review.property_id._id);
  if (req.user.role !== 'admin' && property.agent_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to respond to this review'
    });
  }

  review.response = response;
  review.response_date = new Date();
  review.responded_by = req.user.id;
  await review.save();

  await review.populate([
    { path: 'user_id', select: 'name profile_image' },
    { path: 'responded_by', select: 'name' }
  ]);

  res.json({
    success: true,
    message: 'Response added successfully',
    data: review
  });
});

const getAgentReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { rating, sort_by } = req.query;

  let filter = { agent_id: req.params.id };
  
  if (rating) {
    const ratings = Array.isArray(rating) ? rating : [rating];
    filter.rating = { $in: ratings.map(r => parseInt(r)) };
  }

  let sort = { created_at: -1 };
  if (sort_by === 'rating_high') sort = { rating: -1, created_at: -1 };
  if (sort_by === 'rating_low') sort = { rating: 1, created_at: -1 };
  if (sort_by === 'helpful') sort = { helpful_count: -1, created_at: -1 };

  const reviews = await AgentReview.find(filter)
    .populate([
      { path: 'user_id', select: 'name profile_image' },
      { path: 'property_id', select: 'title' }
    ])
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await AgentReview.countDocuments(filter);

  const ratingStats = await AgentReview.aggregate([
    { $match: { agent_id: mongoose.Types.ObjectId(req.params.id) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        avgCommunication: { $avg: '$communication_rating' },
        avgProfessionalism: { $avg: '$professionalism_rating' },
        avgKnowledge: { $avg: '$knowledge_rating' }
      }
    }
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    stats: ratingStats[0] || {
      averageRating: 0,
      totalReviews: 0,
      rating1: 0,
      rating2: 0,
      rating3: 0,
      rating4: 0,
      rating5: 0,
      avgCommunication: 0,
      avgProfessionalism: 0,
      avgKnowledge: 0
    }
  });
});

const createAgentReview = asyncHandler(async (req, res) => {
  const { rating, review, property_id, communication_rating, professionalism_rating, knowledge_rating } = req.body;

  const agent = await Agent.findById(req.params.id);
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  const existingReview = await AgentReview.findOne({
    agent_id: req.params.id,
    user_id: req.user.id
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this agent'
    });
  }

  const agentReview = await AgentReview.create({
    agent_id: req.params.id,
    user_id: req.user.id,
    rating,
    review,
    property_id,
    communication_rating,
    professionalism_rating,
    knowledge_rating
  });

  await agentReview.populate([
    { path: 'user_id', select: 'name profile_image' },
    { path: 'property_id', select: 'title' }
  ]);

  const reviews = await AgentReview.find({ agent_id: req.params.id });
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  
  await Agent.findByIdAndUpdate(req.params.id, {
    'rating.average': averageRating,
    'rating.count': reviews.length
  });

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: agentReview
  });
});

const updateAgentReview = asyncHandler(async (req, res) => {
  const { rating, review, communication_rating, professionalism_rating, knowledge_rating } = req.body;

  const agentReview = await AgentReview.findById(req.params.id);

  if (!agentReview) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  if (agentReview.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this review'
    });
  }

  const updatedReview = await AgentReview.findByIdAndUpdate(
    req.params.id,
    { rating, review, communication_rating, professionalism_rating, knowledge_rating },
    { new: true, runValidators: true }
  ).populate([
    { path: 'user_id', select: 'name profile_image' },
    { path: 'property_id', select: 'title' }
  ]);

  const reviews = await AgentReview.find({ agent_id: agentReview.agent_id });
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  
  await Agent.findByIdAndUpdate(agentReview.agent_id, {
    'rating.average': averageRating,
    'rating.count': reviews.length
  });

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: updatedReview
  });
});

const deleteAgentReview = asyncHandler(async (req, res) => {
  const agentReview = await AgentReview.findById(req.params.id);

  if (!agentReview) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  if (agentReview.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }

  const agentId = agentReview.agent_id;
  await AgentReview.findByIdAndDelete(req.params.id);

  const reviews = await AgentReview.find({ agent_id: agentId });
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  
  await Agent.findByIdAndUpdate(agentId, {
    'rating.average': averageRating,
    'rating.count': reviews.length
  });

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

const getMyReviews = asyncHandler(async (req, res) => {
  const { type } = req.query;
  
  let reviews = [];
  
  if (type === 'property' || !type) {
    const propertyReviews = await PropertyReview.find({ user_id: req.user.id })
      .populate([
        { path: 'property_id', select: 'title location' }
      ])
      .sort({ created_at: -1 });
    reviews = reviews.concat(propertyReviews.map(r => ({ ...r.toObject(), review_type: 'property' })));
  }
  
  if (type === 'agent' || !type) {
    const agentReviews = await AgentReview.find({ user_id: req.user.id })
      .populate([
        { path: 'agent_id', populate: { path: 'user_id', select: 'name' } },
        { path: 'property_id', select: 'title' }
      ])
      .sort({ created_at: -1 });
    reviews = reviews.concat(agentReviews.map(r => ({ ...r.toObject(), review_type: 'agent' })));
  }

  reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    success: true,
    data: reviews
  });
});

module.exports = {
  getPropertyReviews,
  createPropertyReview,
  updatePropertyReview,
  deletePropertyReview,
  markReviewHelpful,
  respondToPropertyReview,
  getAgentReviews,
  createAgentReview,
  updateAgentReview,
  deleteAgentReview,
  getMyReviews
};
