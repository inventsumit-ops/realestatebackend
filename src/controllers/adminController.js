const User = require('../models/User');
const Property = require('../models/Property');
const Agent = require('../models/Agent');
const Inquiry = require('../models/Inquiry');
const Appointment = require('../models/Appointment');
const Review = require('../models/PropertyReview');
const Advertisement = require('../models/Advertisement');
const Blog = require('../models/Blog');
const BlogCategory = require('../models/BlogCategory');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const FeaturedProperty = require('../models/FeaturedProperty');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getDashboard = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ isActive: true });
  const totalAgents = await Agent.countDocuments({ is_active: true });
  const totalProperties = await Property.countDocuments();
  const totalInquiries = await Inquiry.countDocuments();
  const totalAppointments = await Appointment.countDocuments();

  const recentUsers = await User.find({ isActive: true })
    .select('name email role createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentProperties = await Property.find()
    .populate('agent_id', 'user_id')
    .sort({ createdAt: -1 })
    .limit(5);

  const pendingInquiries = await Inquiry.find({ status: 'pending' })
    .populate(['user_id', 'property_id'])
    .sort({ createdAt: -1 })
    .limit(5);

  const unverifiedAgents = await Agent.find({ verified: false, is_active: true })
    .populate('user_id', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const propertyStats = await Property.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const inquiryStats = await Inquiry.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const userStats = await User.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const monthlyStats = await ActivityLog.aggregate([
    { $match: { created_at: { $gte: last30Days } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        users: { $addToSet: '$user_id' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        date: '$_id',
        activeUsers: { $size: '$users' },
        activities: '$count'
      }
    },
    { $sort: { date: 1 } }
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalAgents,
        totalProperties,
        totalInquiries,
        totalAppointments
      },
      recent: {
        users: recentUsers,
        properties: recentProperties,
        inquiries: pendingInquiries,
        agents: unverifiedAgents
      },
      stats: {
        properties: propertyStats,
        inquiries: inquiryStats,
        users: userStats
      },
      monthlyStats
    }
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { role, status, search, sort_by } = req.query;

  let filter = {};
  
  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') }
    ];
  }

  let sort = { createdAt: -1 };
  if (sort_by === 'name') sort = { name: 1 };
  if (sort_by === 'email') sort = { email: 1 };
  if (sort_by === 'role') sort = { role: 1 };

  const users = await User.find(filter)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await User.countDocuments(filter);

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

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.role === 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete admin user'
    });
  }

  user.isActive = false;
  await user.save();

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'admin_delete_user',
    resource_type: 'User',
    resource_id: user._id,
    description: `Admin deleted user: ${user.name}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

const getProperties = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, property_type, agent_id, is_approved, search, sort_by } = req.query;

  let filter = {};
  
  if (status) filter.status = status;
  if (property_type) filter.property_type = property_type;
  if (agent_id) filter.agent_id = agent_id;
  if (is_approved !== undefined) filter.isApproved = is_approved === 'true';
  
  if (search) {
    filter.$text = { $search: search };
  }

  let sort = { createdAt: -1 };
  if (sort_by === 'price_low') sort = { price: 1 };
  if (sort_by === 'price_high') sort = { price: -1 };
  if (sort_by === 'title') sort = { title: 1 };

  const properties = await Property.find(filter)
    .populate([
      { path: 'agent_id', populate: { path: 'user_id', select: 'name email' } },
      { path: 'property_images', match: { is_primary: true } }
    ])
    .skip(skip)
    .limit(limit)
    .sort(sort);

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

const approveProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  property.isApproved = true;
  property.approvedAt = new Date();
  property.approvedBy = req.user.id;
  await property.save();

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'admin_approve_property',
    resource_type: 'Property',
    resource_id: property._id,
    description: `Admin approved property: ${property.title}`,
    ip_address: req.ip
  });

  await Notification.create({
    user_id: property.agent_id,
    title: 'Property Approved',
    message: `Your property "${property.title}" has been approved`,
    type: 'property_update',
    related_id: property._id,
    related_model: 'Property'
  });

  res.json({
    success: true,
    message: 'Property approved successfully',
    data: property
  });
});

const rejectProperty = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  property.isApproved = false;
  await property.save();

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'admin_reject_property',
    resource_type: 'Property',
    resource_id: property._id,
    description: `Admin rejected property: ${property.title}. Reason: ${reason}`,
    ip_address: req.ip
  });

  await Notification.create({
    user_id: property.agent_id,
    title: 'Property Rejected',
    message: `Your property "${property.title}" has been rejected. Reason: ${reason}`,
    type: 'property_update',
    related_id: property._id,
    related_model: 'Property'
  });

  res.json({
    success: true,
    message: 'Property rejected successfully'
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

  await Property.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'admin_delete_property',
    resource_type: 'Property',
    resource_id: property._id,
    description: `Admin deleted property: ${property.title}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Property deleted successfully'
  });
});

const getAgents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { verified, status, search, sort_by } = req.query;

  let filter = {};
  
  if (verified !== undefined) filter.verified = verified === 'true';
  if (status === 'active') filter.is_active = true;
  if (status === 'inactive') filter.is_active = false;
  
  if (search) {
    const users = await User.find({
      $or: [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ]
    }).select('_id');
    
    filter.$or = [
      { user_id: { $in: users.map(u => u._id) } },
      { agency_name: new RegExp(search, 'i') },
      { license_number: new RegExp(search, 'i') }
    ];
  }

  let sort = { createdAt: -1 };
  if (sort_by === 'name') sort = { 'user_id.name': 1 };
  if (sort_by === 'agency') sort = { agency_name: 1 };
  if (sort_by === 'rating') sort = { 'rating.average': -1 };

  const agents = await Agent.find(filter)
    .populate({ path: 'user_id', select: 'name email profile_image' })
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Agent.countDocuments(filter);

  res.json({
    success: true,
    data: agents,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const verifyAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  agent.verified = true;
  agent.verification_date = new Date();
  await agent.save();

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'admin_verify_agent',
    resource_type: 'Agent',
    resource_id: agent._id,
    description: `Admin verified agent: ${agent.agency_name}`,
    ip_address: req.ip
  });

  await Notification.create({
    user_id: agent.user_id,
    title: 'Agent Verification Approved',
    message: 'Your agent account has been verified',
    type: 'system',
    related_id: agent._id,
    related_model: 'Agent'
  });

  res.json({
    success: true,
    message: 'Agent verified successfully',
    data: agent
  });
});

const getReports = asyncHandler(async (req, res) => {
  const { type, date_from, date_to } = req.query;

  let filter = {};
  
  if (date_from || date_to) {
    filter.created_at = {};
    if (date_from) filter.created_at.$gte = new Date(date_from);
    if (date_to) filter.created_at.$lte = new Date(date_to);
  }

  let data = {};

  switch (type) {
    case 'users':
      data = await User.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            byRole: {
              $push: {
                role: '$role',
                count: 1
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      break;

    case 'properties':
      data = await Property.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            byType: {
              $push: {
                type: '$property_type',
                count: 1
              }
            },
            avgPrice: { $avg: '$price' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      break;

    case 'inquiries':
      data = await Inquiry.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                count: 1
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      break;

    default:
      data = {
        users: await User.countDocuments(filter),
        agents: await Agent.countDocuments(filter),
        properties: await Property.countDocuments(filter),
        inquiries: await Inquiry.countDocuments(filter),
        appointments: await Appointment.countDocuments(filter)
      };
  }

  res.json({
    success: true,
    data
  });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const { period } = req.query;

  let dateFilter = {};
  if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    dateFilter = { $gte: weekAgo };
  } else if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    dateFilter = { $gte: monthAgo };
  } else if (period === 'year') {
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    dateFilter = { $gte: yearAgo };
  }

  const userGrowth = await User.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const propertyGrowth = await Property.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const inquiryGrowth = await Inquiry.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const topAgents = await Agent.find({ verified: true, is_active: true })
    .populate('user_id', 'name')
    .sort({ 'rating.average': -1 })
    .limit(10);

  const topProperties = await Property.find({ isApproved: true })
    .populate('agent_id', 'user_id')
    .sort({ views_count: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      userGrowth,
      propertyGrowth,
      inquiryGrowth,
      topAgents,
      topProperties
    }
  });
});

const getLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const { action, user_id, date_from, date_to } = req.query;

  let filter = {};
  
  if (action) filter.action = action;
  if (user_id) filter.user_id = user_id;
  
  if (date_from || date_to) {
    filter.created_at = {};
    if (date_from) filter.created_at.$gte = new Date(date_from);
    if (date_to) filter.created_at.$lte = new Date(date_to);
  }

  const logs = await ActivityLog.find(filter)
    .populate('user_id', 'name email')
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 });

  const total = await ActivityLog.countDocuments(filter);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const createAdvertisement = asyncHandler(async (req, res) => {
  const adData = req.body;
  adData.created_by = req.user.id;

  const advertisement = await Advertisement.create(adData);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'admin_create_ad',
    resource_type: 'Advertisement',
    resource_id: advertisement._id,
    description: `Admin created advertisement: ${advertisement.title}`,
    ip_address: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Advertisement created successfully',
    data: advertisement
  });
});

const getAdvertisements = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, ad_type, position, sort_by } = req.query;

  let filter = {};
  
  if (status) filter.status = status;
  if (ad_type) filter.ad_type = ad_type;
  if (position) filter.position = position;

  let sort = { createdAt: -1 };
  if (sort_by === 'clicks') sort = { clicks: -1 };
  if (sort_by === 'impressions') sort = { impressions: -1 };

  const advertisements = await Advertisement.find(filter)
    .populate('created_by', 'name')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Advertisement.countDocuments(filter);

  res.json({
    success: true,
    data: advertisements,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const updateAdvertisement = asyncHandler(async (req, res) => {
  const advertisement = await Advertisement.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('created_by', 'name');

  if (!advertisement) {
    return res.status(404).json({
      success: false,
      message: 'Advertisement not found'
    });
  }

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'admin_update_ad',
    resource_type: 'Advertisement',
    resource_id: advertisement._id,
    description: `Admin updated advertisement: ${advertisement.title}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Advertisement updated successfully',
    data: advertisement
  });
});

const deleteAdvertisement = asyncHandler(async (req, res) => {
  const advertisement = await Advertisement.findById(req.params.id);

  if (!advertisement) {
    return res.status(404).json({
      success: false,
      message: 'Advertisement not found'
    });
  }

  await Advertisement.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'admin_delete_ad',
    resource_type: 'Advertisement',
    resource_id: advertisement._id,
    description: `Admin deleted advertisement: ${advertisement.title}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Advertisement deleted successfully'
  });
});

const createBlog = asyncHandler(async (req, res) => {
  const blogData = req.body;
  blogData.author_id = req.user.id;

  if (!blogData.slug) {
    blogData.slug = blogData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  const blog = await Blog.create(blogData);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'create_blog',
    resource_type: 'Blog',
    resource_id: blog._id,
    description: `Admin created blog: ${blog.title}`,
    ip_address: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Blog created successfully',
    data: blog
  });
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = {
    site: {
      name: 'Real Estate Platform',
      description: 'Find your dream property',
      contactEmail: process.env.EMAIL_USER,
      maintenance: false
    },
    features: {
      propertyApproval: true,
      agentVerification: true,
      emailNotifications: true,
      smsNotifications: false
    },
    limits: {
      maxPropertyImages: 10,
      maxPropertyVideos: 3,
      maxFileSize: 5 * 1024 * 1024
    }
  };

  res.json({
    success: true,
    data: settings
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'update_settings',
    description: 'Admin updated system settings',
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: settings
  });
});

// Create User
const createUser = asyncHandler(async (req, res) => {
  const { 
    name, 
    email, 
    phone, 
    password, 
    role, 
    isActive,
    bio,
    address,
    city,
    country,
    profile_image 
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'user',
    isActive: isActive !== undefined ? isActive : true,
    profile_image: profile_image || null
  });

  // Create user profile if additional fields are provided
  if (bio || address || city || country) {
    const UserProfile = require('../models/UserProfile');
    await UserProfile.create({
      user_id: user._id,
      bio: bio || '',
      address: address || '',
      city: city || '',
      country: country || ''
    });
  }

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'admin_create_user',
    description: `Admin created user: ${name}`,
    ip_address: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
});

// Create Property
const createProperty = asyncHandler(async (req, res) => {
  const propertyData = req.body;
  propertyData.agent_id = req.user.id;

  const property = await Property.create(propertyData);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'create_property',
    description: `Admin created property: ${property.title}`,
    ip_address: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Property created successfully',
    data: property
  });
});

// Create Agent
const createAgent = asyncHandler(async (req, res) => {
  const agentData = req.body;
  agentData.user_id = req.user.id;

  const agent = await Agent.create(agentData);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'create_agent',
    description: `Admin created agent: ${agentData.name}`,
    ip_address: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Agent created successfully',
    data: agent
  });
});

// Get Inquiries
const getInquiries = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    property_id,
    user_id
  } = req.query;

  const query = {};
  
  if (status) query.status = status;
  if (property_id) query.property_id = property_id;
  if (user_id) query.user_id = user_id;
  if (search) {
    query.$or = [
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  const inquiries = await Inquiry.find(query)
    .populate('user_id', 'name email')
    .populate('property_id', 'title')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Inquiry.countDocuments(query);

  res.json({
    success: true,
    data: inquiries,
    pagination: {
      current: parseInt(page),
      pageSize: parseInt(limit),
      total
    }
  });
});

// Create Inquiry
const createInquiry = asyncHandler(async (req, res) => {
  const inquiryData = req.body;
  inquiryData.user_id = req.user.id;

  const inquiry = await Inquiry.create(inquiryData);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'create_inquiry',
    description: `Admin created inquiry for property: ${inquiryData.property_id}`,
    ip_address: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Inquiry created successfully',
    data: inquiry
  });
});

// Update Inquiry Status
const updateInquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const inquiry = await Inquiry.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'update_inquiry_status',
    description: `Admin updated inquiry status to: ${status}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Inquiry status updated successfully',
    data: inquiry
  });
});

// Delete Inquiry
const deleteInquiry = asyncHandler(async (req, res) => {
  await Inquiry.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'delete_inquiry',
    description: `Admin deleted inquiry: ${req.params.id}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Inquiry deleted successfully'
  });
});

// Get Appointments
const getAppointments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    date_from,
    date_to,
    agent_id,
    user_id
  } = req.query;

  const query = {};
  
  if (status) query.status = status;
  if (agent_id) query.agent_id = agent_id;
  if (user_id) query.user_id = user_id;
  if (date_from || date_to) {
    query.date = {};
    if (date_from) query.date.$gte = new Date(date_from);
    if (date_to) query.date.$lte = new Date(date_to);
  }
  if (search) {
    query.$or = [
      { notes: { $regex: search, $options: 'i' } }
    ];
  }

  const appointments = await Appointment.find(query)
    .populate('user_id', 'name email')
    .populate('agent_id', 'name email')
    .populate('property_id', 'title')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Appointment.countDocuments(query);

  res.json({
    success: true,
    data: appointments,
    pagination: {
      current: parseInt(page),
      pageSize: parseInt(limit),
      total
    }
  });
});

// Create Appointment
const createAppointment = asyncHandler(async (req, res) => {
  const appointmentData = req.body;
  appointmentData.user_id = req.user.id;

  const appointment = await Appointment.create(appointmentData);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'create_appointment',
    description: `Admin created appointment for property: ${appointmentData.property_id}`,
    ip_address: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: appointment
  });
});

// Update Appointment Status
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'update_appointment_status',
    description: `Admin updated appointment status to: ${status}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Appointment status updated successfully',
    data: appointment
  });
});

// Delete Appointment
const deleteAppointment = asyncHandler(async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'delete_appointment',
    description: `Admin deleted appointment: ${req.params.id}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Appointment deleted successfully'
  });
});

// Get Blogs
const getBlogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    category,
    author_id
  } = req.query;

  const query = {};
  
  if (status) query.status = status;
  if (category) query.category_id = category;
  if (author_id) query.author_id = author_id;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  const blogs = await Blog.find(query)
    .populate('author_id', 'name email')
    .populate('category_id', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Blog.countDocuments(query);

  res.json({
    success: true,
    data: blogs,
    pagination: {
      current: parseInt(page),
      pageSize: parseInt(limit),
      total
    }
  });
});

// Update Blog
const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'update_blog',
    description: `Admin updated blog: ${blog.title}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Blog updated successfully',
    data: blog
  });
});

// Delete Blog
const deleteBlog = asyncHandler(async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    user_id: req.user.id,
    action: 'delete_blog',
    description: `Admin deleted blog: ${req.params.id}`,
    ip_address: req.ip
  });

  res.json({
    success: true,
    message: 'Blog deleted successfully'
  });
});

module.exports = {
  getDashboard,
  getUsers,
  createUser,
  deleteUser,
  getProperties,
  createProperty,
  approveProperty,
  rejectProperty,
  deleteProperty,
  getAgents,
  createAgent,
  verifyAgent,
  getInquiries,
  createInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getReports,
  getAnalytics,
  getLogs,
  createAdvertisement,
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  createBlog,
  getBlogs,
  updateBlog,
  deleteBlog,
  getSettings,
  updateSettings
};
