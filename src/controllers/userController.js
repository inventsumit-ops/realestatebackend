const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Favorite = require('../models/Favorite');
const PropertyReview = require('../models/PropertyReview');
const Appointment = require('../models/Appointment');
const Inquiry = require('../models/Inquiry');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find({ isActive: true })
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments({ isActive: true });

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('user_profile');

  if (!user || !user.isActive) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, phone, role, isActive } = req.body;
  const profileData = req.body.profile || {};

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (role && req.user.role === 'admin') user.role = role;
  if (isActive !== undefined && req.user.role === 'admin') user.isActive = isActive;
  
  await user.save();

  if (Object.keys(profileData).length > 0) {
    await UserProfile.findOneAndUpdate(
      { user_id: user._id },
      profileData,
      { upsert: true, new: true }
    );
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

const getFavorites = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const favorites = await Favorite.find({ user_id: req.user.id })
    .populate({
      path: 'property_id',
      populate: [
        { path: 'agent_id', select: 'user_id' },
        { path: 'property_images', match: { is_primary: true } }
      ]
    })
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 });

  const total = await Favorite.countDocuments({ user_id: req.user.id });

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

const getAppointments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const appointments = await Appointment.find({ user_id: req.user.id })
    .populate([
      { path: 'property_id', select: 'title location' },
      { path: 'agent_id', populate: { path: 'user_id', select: 'name email' } }
    ])
    .skip(skip)
    .limit(limit)
    .sort({ appointment_date: -1 });

  const total = await Appointment.countDocuments({ user_id: req.user.id });

  res.json({
    success: true,
    data: appointments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const createAppointment = asyncHandler(async (req, res) => {
  const { property_id, agent_id, appointment_date, notes } = req.body;

  const appointment = await Appointment.create({
    user_id: req.user.id,
    property_id,
    agent_id,
    appointment_date: new Date(appointment_date),
    notes
  });

  await appointment.populate([
    { path: 'property_id', select: 'title location' },
    { path: 'agent_id', populate: { path: 'user_id', select: 'name email' } }
  ]);

  await Notification.create({
    user_id: agent_id,
    title: 'New Appointment Request',
    message: `You have a new appointment request for property`,
    type: 'appointment',
    related_id: appointment._id,
    related_model: 'Appointment'
  });

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: appointment
  });
});

const getInquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const inquiries = await Inquiry.find({ user_id: req.user.id })
    .populate([
      { path: 'property_id', select: 'title location price' },
      { path: 'responded_by', select: 'name' }
    ])
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 });

  const total = await Inquiry.countDocuments({ user_id: req.user.id });

  res.json({
    success: true,
    data: inquiries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const createReview = asyncHandler(async (req, res) => {
  const { property_id, rating, comment } = req.body;

  const existingReview = await PropertyReview.findOne({
    user_id: req.user.id,
    property_id
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this property'
    });
  }

  const review = await PropertyReview.create({
    user_id: req.user.id,
    property_id,
    rating,
    comment
  });

  await review.populate([
    { path: 'user_id', select: 'name profile_image' },
    { path: 'property_id', select: 'title' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review
  });
});

const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ user_id: req.user.id })
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 });

  const total = await Notification.countDocuments({ user_id: req.user.id });
  const unreadCount = await Notification.countDocuments({ 
    user_id: req.user.id, 
    is_read: false 
  });

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user.id },
    { is_read: true, read_at: new Date() },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

const uploadProfileImage = asyncHandler(async (req, res) => {
  const { profile_image_url, profile_image_key } = req.body;

  if (!profile_image_url || !profile_image_key) {
    return res.status(400).json({
      success: false,
      message: 'Profile image URL and key are required'
    });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.profile_image = profile_image_url;
  user.profile_image_key = profile_image_key;
  await user.save();

  res.json({
    success: true,
    message: 'Profile image updated successfully',
    data: {
      profile_image: user.profile_image,
      profile_image_key: user.profile_image_key
    }
  });
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user_id: req.user.id, is_read: false },
    { is_read: true, read_at: new Date() }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  getAppointments,
  createAppointment,
  getInquiries,
  createReview,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  uploadProfileImage
};
