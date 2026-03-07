const Inquiry = require('../models/Inquiry');
const Property = require('../models/Property');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendInquiryNotification } = require('../services/emailService');

const getInquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, priority, date_from, date_to } = req.query;

  let filter = {};
  
  if (req.user.role === 'agent') {
    const agentPropertyIds = await Property.find({ agent_id: req.user.id }).distinct('_id');
    filter.property_id = { $in: agentPropertyIds };
  } else if (req.user.role === 'user') {
    filter.user_id = req.user.id;
  }
  
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  
  if (date_from || date_to) {
    filter.created_at = {};
    if (date_from) filter.created_at.$gte = new Date(date_from);
    if (date_to) filter.created_at.$lte = new Date(date_to);
  }

  const inquiries = await Inquiry.find(filter)
    .populate([
      { path: 'user_id', select: 'name email phone profile_image' },
      { path: 'property_id', select: 'title location price agent_id' },
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

const getInquiryById = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate([
      { path: 'user_id', select: 'name email phone profile_image' },
      { path: 'property_id', select: 'title location price agent_id', populate: { path: 'agent_id' } },
      { path: 'responded_by', select: 'name' }
    ]);

  if (!inquiry) {
    return res.status(404).json({
      success: false,
      message: 'Inquiry not found'
    });
  }

  if (req.user.role === 'agent') {
    const agentPropertyIds = await Property.find({ agent_id: req.user.id }).distinct('_id');
    if (!agentPropertyIds.includes(inquiry.property_id._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this inquiry'
      });
    }
  } else if (req.user.role === 'user') {
    if (inquiry.user_id._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this inquiry'
      });
    }
  }

  res.json({
    success: true,
    data: inquiry
  });
});

const createInquiry = asyncHandler(async (req, res) => {
  const { property_id, message, priority, contact_method, preferred_contact_time } = req.body;

  const property = await Property.findById(property_id).populate('agent_id');
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  const user = await User.findById(req.user.id);
  
  const inquiry = await Inquiry.create({
    user_id: req.user.id,
    property_id,
    message,
    priority: priority || 'medium',
    contact_method: contact_method || 'email',
    preferred_contact_time
  });

  await inquiry.populate([
    { path: 'user_id', select: 'name email phone' },
    { path: 'property_id', select: 'title location price' }
  ]);

  await Notification.create({
    user_id: property.agent_id.user_id,
    title: 'New Property Inquiry',
    message: `New inquiry received for ${property.title}`,
    type: 'inquiry',
    related_id: inquiry._id,
    related_model: 'Inquiry'
  });

  try {
    await sendInquiryNotification(
      property.agent_id.user_id.email,
      user.name,
      property.title,
      user.name,
      message
    );
  } catch (emailError) {
    console.error('Failed to send inquiry email:', emailError);
  }

  res.status(201).json({
    success: true,
    message: 'Inquiry sent successfully',
    data: inquiry
  });
});

const updateInquiry = asyncHandler(async (req, res) => {
  const { status, agent_response, priority } = req.body;

  const inquiry = await Inquiry.findById(req.params.id)
    .populate('property_id');

  if (!inquiry) {
    return res.status(404).json({
      success: false,
      message: 'Inquiry not found'
    });
  }

  if (req.user.role === 'agent') {
    const agentPropertyIds = await Property.find({ agent_id: req.user.id }).distinct('_id');
    if (!agentPropertyIds.includes(inquiry.property_id._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this inquiry'
      });
    }
  } else if (req.user.role === 'user') {
    if (inquiry.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this inquiry'
      });
    }
  }

  const updateData = {};
  if (status) {
    updateData.status = status;
    if (status === 'responded' && req.user.role === 'agent') {
      updateData.responded_by = req.user.id;
      updateData.responded_at = new Date();
    }
  }
  if (agent_response && req.user.role === 'agent') {
    updateData.agent_response = agent_response;
    updateData.responded_by = req.user.id;
    updateData.responded_at = new Date();
    updateData.status = 'responded';
  }
  if (priority && req.user.role === 'admin') {
    updateData.priority = priority;
  }

  const updatedInquiry = await Inquiry.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'user_id', select: 'name email phone' },
    { path: 'property_id', select: 'title location price' },
    { path: 'responded_by', select: 'name' }
  ]);

  if (status === 'responded' || agent_response) {
    await Notification.create({
      user_id: inquiry.user_id,
      title: 'Inquiry Response',
      message: `Agent has responded to your inquiry for ${inquiry.property_id.title}`,
      type: 'inquiry',
      related_id: inquiry._id,
      related_model: 'Inquiry'
    });
  }

  res.json({
    success: true,
    message: 'Inquiry updated successfully',
    data: updatedInquiry
  });
});

const deleteInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id).populate('property_id');

  if (!inquiry) {
    return res.status(404).json({
      success: false,
      message: 'Inquiry not found'
    });
  }

  if (req.user.role === 'agent') {
    const agentPropertyIds = await Property.find({ agent_id: req.user.id }).distinct('_id');
    if (!agentPropertyIds.includes(inquiry.property_id._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this inquiry'
      });
    }
  } else if (req.user.role === 'user') {
    if (inquiry.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this inquiry'
      });
    }
  }

  await Inquiry.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Inquiry deleted successfully'
  });
});

const getInquiryStats = asyncHandler(async (req, res) => {
  let filter = {};
  
  if (req.user.role === 'agent') {
    const agentPropertyIds = await Property.find({ agent_id: req.user.id }).distinct('_id');
    filter.property_id = { $in: agentPropertyIds };
  }

  const totalInquiries = await Inquiry.countDocuments(filter);
  const pendingInquiries = await Inquiry.countDocuments({ ...filter, status: 'pending' });
  const respondedInquiries = await Inquiry.countDocuments({ ...filter, status: 'responded' });
  const closedInquiries = await Inquiry.countDocuments({ ...filter, status: 'closed' });

  const highPriorityInquiries = await Inquiry.countDocuments({ ...filter, priority: 'high' });
  const mediumPriorityInquiries = await Inquiry.countDocuments({ ...filter, priority: 'medium' });
  const lowPriorityInquiries = await Inquiry.countDocuments({ ...filter, priority: 'low' });

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const recentInquiries = await Inquiry.countDocuments({
    ...filter,
    created_at: { $gte: last30Days }
  });

  res.json({
    success: true,
    data: {
      total: totalInquiries,
      pending: pendingInquiries,
      responded: respondedInquiries,
      closed: closedInquiries,
      highPriority: highPriorityInquiries,
      mediumPriority: mediumPriorityInquiries,
      lowPriority: lowPriorityInquiries,
      recent30Days: recentInquiries
    }
  });
});

const bulkUpdateInquiries = asyncHandler(async (req, res) => {
  const { inquiry_ids, status, priority } = req.body;

  if (!inquiry_ids || !Array.isArray(inquiry_ids)) {
    return res.status(400).json({
      success: false,
      message: 'Inquiry IDs array is required'
    });
  }

  let filter = { _id: { $in: inquiry_ids } };
  
  if (req.user.role === 'agent') {
    const agentPropertyIds = await Property.find({ agent_id: req.user.id }).distinct('_id');
    const inquiries = await Inquiry.find({ _id: { $in: inquiry_ids } });
    const validInquiryIds = inquiries
      .filter(inquiry => agentPropertyIds.includes(inquiry.property_id.toString()))
      .map(inquiry => inquiry._id);
    
    filter._id = { $in: validInquiryIds };
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (priority && req.user.role === 'admin') updateData.priority = priority;

  const result = await Inquiry.updateMany(filter, updateData);

  res.json({
    success: true,
    message: `${result.modifiedCount} inquiries updated successfully`,
    modifiedCount: result.modifiedCount
  });
});

module.exports = {
  getInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  getInquiryStats,
  bulkUpdateInquiries
};
