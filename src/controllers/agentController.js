const Agent = require('../models/Agent');
const User = require('../models/User');
const Property = require('../models/Property');
const AgentReview = require('../models/AgentReview');
const Appointment = require('../models/Appointment');
const Inquiry = require('../models/Inquiry');
const { asyncHandler } = require('../middleware/errorMiddleware');

const registerAgent = asyncHandler(async (req, res) => {
  const {
    license_number,
    agency_name,
    experience_years,
    specialties,
    languages,
    service_areas,
    bio,
    social_links
  } = req.body;

  if (req.user.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: 'User must have agent role to register as agent'
    });
  }

  const existingAgent = await Agent.findOne({ user_id: req.user.id });
  if (existingAgent) {
    return res.status(400).json({
      success: false,
      message: 'Agent profile already exists'
    });
  }

  const agent = await Agent.create({
    user_id: req.user.id,
    license_number,
    agency_name,
    experience_years,
    specialties,
    languages,
    service_areas,
    bio,
    social_links
  });

  await agent.populate({ path: 'user_id', select: 'name email profile_image' });

  res.status(201).json({
    success: true,
    message: 'Agent registered successfully',
    data: agent
  });
});

const getAgents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const {
    city,
    state,
    specialties,
    verified,
    min_experience,
    max_experience,
    search
  } = req.query;

  const filter = { is_active: true };
  
  if (city) filter['service_areas.city'] = new RegExp(city, 'i');
  if (state) filter['service_areas.state'] = new RegExp(state, 'i');
  if (specialties) filter.specialties = { $in: Array.isArray(specialties) ? specialties : [specialties] };
  if (verified !== undefined) filter.verified = verified === 'true';
  
  if (min_experience || max_experience) {
    filter.experience_years = {};
    if (min_experience) filter.experience_years.$gte = parseInt(min_experience);
    if (max_experience) filter.experience_years.$lte = parseInt(max_experience);
  }
  
  if (search) {
    const users = await User.find({
      $or: [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ]
    }).select('_id');
    
    filter.$or = [
      { user_id: { $in: users.map(u => u._id) } },
      { agency_name: new RegExp(search, 'i') }
    ];
  }

  const agents = await Agent.find(filter)
    .populate({ path: 'user_id', select: 'name email profile_image' })
    .skip(skip)
    .limit(limit)
    .sort({ 'rating.average': -1, experience_years: -1 });

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

const getAgentById = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id)
    .populate({ path: 'user_id', select: 'name email profile_image phone' });

  if (!agent || !agent.is_active) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  const properties = await Property.find({ 
    agent_id: agent._id, 
    isApproved: true 
  })
    .populate('property_images')
    .limit(6)
    .sort({ createdAt: -1 });

  const reviews = await AgentReview.find({ agent_id: agent._id })
    .populate({ path: 'user_id', select: 'name profile_image' })
    .limit(10)
    .sort({ created_at: -1 });

  res.json({
    success: true,
    data: {
      ...agent.toObject(),
      properties,
      reviews
    }
  });
});

const updateAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  if (req.user.role !== 'admin' && agent.user_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this agent profile'
    });
  }

  const updateData = { ...req.body };
  delete updateData.verification_documents;

  const updatedAgent = await Agent.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate({ path: 'user_id', select: 'name email profile_image' });

  res.json({
    success: true,
    message: 'Agent profile updated successfully',
    data: updatedAgent
  });
});

const deleteAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  agent.is_active = false;
  await agent.save();

  res.json({
    success: true,
    message: 'Agent deactivated successfully'
  });
});

const getAgentProperties = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, property_type, min_price, max_price } = req.query;

  const filter = { agent_id: req.params.id };
  
  if (status) filter.status = status;
  if (property_type) filter.property_type = property_type;
  if (min_price || max_price) {
    filter.price = {};
    if (min_price) filter.price.$gte = parseFloat(min_price);
    if (max_price) filter.price.$lte = parseFloat(max_price);
  }

  const properties = await Property.find(filter)
    .populate('property_images')
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

const getAgentReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await AgentReview.find({ agent_id: req.params.id })
    .populate([
      { path: 'user_id', select: 'name profile_image' },
      { path: 'property_id', select: 'title' }
    ])
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 });

  const total = await AgentReview.countDocuments({ agent_id: req.params.id });

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

const createAgentReview = asyncHandler(async (req, res) => {
  const { rating, review, property_id, communication_rating, professionalism_rating, knowledge_rating } = req.body;

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

const getAgentAppointments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, date_from, date_to } = req.query;

  const filter = { agent_id: req.params.id };
  
  if (status) filter.status = status;
  if (date_from || date_to) {
    filter.appointment_date = {};
    if (date_from) filter.appointment_date.$gte = new Date(date_from);
    if (date_to) filter.appointment_date.$lte = new Date(date_to);
  }

  const appointments = await Appointment.find(filter)
    .populate([
      { path: 'user_id', select: 'name email phone' },
      { path: 'property_id', select: 'title location' }
    ])
    .skip(skip)
    .limit(limit)
    .sort({ appointment_date: -1 });

  const total = await Appointment.countDocuments(filter);

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

const getAgentInquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, priority } = req.query;

  const filter = { };
  
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const propertyIds = await Property.find({ agent_id: req.params.id }).distinct('_id');
  filter.property_id = { $in: propertyIds };

  const inquiries = await Inquiry.find(filter)
    .populate([
      { path: 'user_id', select: 'name email phone' },
      { path: 'property_id', select: 'title location price' },
      { path: 'responded_by', select: 'name' }
    ])
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 });

  const total = await Inquiry.countDocuments(filter);

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

const verifyAgent = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

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

  res.json({
    success: true,
    message: 'Agent verified successfully',
    data: agent
  });
});

const uploadVerificationDocuments = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  if (req.user.role !== 'admin' && agent.user_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to upload documents for this agent'
    });
  }

  const { documents } = req.body;

  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No document URLs provided'
    });
  }

  const documentPromises = documents.map(async (docData) => {
    const { url, key, document_type, title } = docData;
    
    if (!url || !key) {
      throw new Error('Each document must have url and key');
    }

    return {
      document_url: url,
      document_key: key,
      document_type: document_type || 'application/pdf',
      title: title || '',
      upload_date: new Date()
    };
  });

  const savedDocuments = await Promise.all(documentPromises);

  agent.verification_documents.push(...savedDocuments);
  await agent.save();

  res.status(201).json({
    success: true,
    message: 'Documents uploaded successfully',
    data: agent.verification_documents
  });
});

const getTopAgents = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const agents = await Agent.find({ 
    verified: true, 
    is_active: true,
    'rating.average': { $gte: 4 }
  })
    .populate({ path: 'user_id', select: 'name profile_image' })
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(limit);

  res.json({
    success: true,
    data: agents
  });
});

const getAgentStats = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);
  
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  const totalProperties = await Property.countDocuments({ agent_id: agent._id });
  const activeProperties = await Property.countDocuments({ 
    agent_id: agent._id, 
    status: 'available' 
  });
  const soldProperties = await Property.countDocuments({ 
    agent_id: agent._id, 
    status: 'sold' 
  });
  const totalInquiries = await Inquiry.countDocuments({
    property_id: { $in: await Property.find({ agent_id: agent._id }).distinct('_id') }
  });
  const pendingAppointments = await Appointment.countDocuments({
    agent_id: agent._id,
    status: 'scheduled'
  });

  res.json({
    success: true,
    data: {
      totalProperties,
      activeProperties,
      soldProperties,
      totalInquiries,
      pendingAppointments,
      averageRating: agent.rating.average,
      totalReviews: agent.rating.count,
      experienceYears: agent.experience_years,
      verified: agent.verified
    }
  });
});

module.exports = {
  registerAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  getAgentProperties,
  getAgentReviews,
  createAgentReview,
  getAgentAppointments,
  getAgentInquiries,
  verifyAgent,
  uploadVerificationDocuments,
  getTopAgents,
  getAgentStats
};
