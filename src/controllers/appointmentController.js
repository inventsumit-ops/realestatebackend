const Appointment = require('../models/Appointment');
const Property = require('../models/Property');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendAppointmentConfirmation } = require('../services/emailService');

const getAppointments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, date_from, date_to, sort_by } = req.query;

  let filter = {};
  
  if (req.user.role === 'agent') {
    filter.agent_id = req.user.id;
  } else if (req.user.role === 'user') {
    filter.user_id = req.user.id;
  }
  
  if (status) filter.status = status;
  
  if (date_from || date_to) {
    filter.appointment_date = {};
    if (date_from) filter.appointment_date.$gte = new Date(date_from);
    if (date_to) filter.appointment_date.$lte = new Date(date_to);
  }

  let sort = { appointment_date: -1 };
  if (sort_by === 'date_asc') sort = { appointment_date: 1 };
  if (sort_by === 'created_at') sort = { created_at: -1 };

  const appointments = await Appointment.find(filter)
    .populate([
      { path: 'user_id', select: 'name email phone profile_image' },
      { path: 'property_id', select: 'title location price' },
      { path: 'agent_id', populate: { path: 'user_id', select: 'name email' } }
    ])
    .skip(skip)
    .limit(limit)
    .sort(sort);

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

const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate([
      { path: 'user_id', select: 'name email phone profile_image' },
      { path: 'property_id', select: 'title location price agent_id' },
      { path: 'agent_id', populate: { path: 'user_id', select: 'name email phone' } }
    ]);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  if (req.user.role === 'agent' && appointment.agent_id._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this appointment'
    });
  }

  if (req.user.role === 'user' && appointment.user_id._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this appointment'
    });
  }

  res.json({
    success: true,
    data: appointment
  });
});

const createAppointment = asyncHandler(async (req, res) => {
  const { property_id, agent_id, appointment_date, duration, notes } = req.body;

  const property = await Property.findById(property_id);
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  const agent = await Agent.findById(agent_id);
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  const conflictingAppointment = await Appointment.findOne({
    agent_id,
    appointment_date: {
      $gte: new Date(appointment_date).getTime() - (duration || 60) * 60000,
      $lte: new Date(appointment_date).getTime() + (duration || 60) * 60000
    },
    status: { $in: ['scheduled', 'confirmed'] }
  });

  if (conflictingAppointment) {
    return res.status(400).json({
      success: false,
      message: 'Agent is not available at this time'
    });
  }

  const appointment = await Appointment.create({
    user_id: req.user.id,
    property_id,
    agent_id,
    appointment_date: new Date(appointment_date),
    duration: duration || 60,
    notes
  });

  await appointment.populate([
    { path: 'user_id', select: 'name email phone' },
    { path: 'property_id', select: 'title location' },
    { path: 'agent_id', populate: { path: 'user_id', select: 'name email' } }
  ]);

  await Notification.create({
    user_id: agent.user_id,
    title: 'New Appointment Request',
    message: `New appointment requested for ${property.title}`,
    type: 'appointment',
    related_id: appointment._id,
    related_model: 'Appointment'
  });

  try {
    const user = await User.findById(req.user.id);
    await sendAppointmentConfirmation(
      user.email,
      user.name,
      property.title,
      appointment.appointment_date
    );
  } catch (emailError) {
    console.error('Failed to send appointment email:', emailError);
  }

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: appointment
  });
});

const updateAppointment = asyncHandler(async (req, res) => {
  const { appointment_date, duration, status, notes, feedback, feedback_rating } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  if (req.user.role === 'agent' && appointment.agent_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this appointment'
    });
  }

  if (req.user.role === 'user' && appointment.user_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this appointment'
    });
  }

  const updateData = {};
  if (appointment_date) updateData.appointment_date = new Date(appointment_date);
  if (duration) updateData.duration = duration;
  if (notes) updateData.notes = notes;
  if (feedback) updateData.feedback = feedback;
  if (feedback_rating) updateData.feedback_rating = feedback_rating;

  if (status) {
    updateData.status = status;
    
    if (status === 'cancelled') {
      updateData.cancellation_reason = req.body.cancellation_reason || 'No reason provided';
      updateData.cancelled_by = req.user.id;
      updateData.cancelled_at = new Date();
    }
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'user_id', select: 'name email phone' },
    { path: 'property_id', select: 'title location' },
    { path: 'agent_id', populate: { path: 'user_id', select: 'name email' } }
  ]);

  if (status && status !== appointment.status) {
    const notificationUser = req.user.role === 'agent' ? appointment.user_id : appointment.agent_id;
    
    await Notification.create({
      user_id: notificationUser,
      title: `Appointment ${status}`,
      message: `Appointment has been ${status}`,
      type: 'appointment',
      related_id: appointment._id,
      related_model: 'Appointment'
    });
  }

  res.json({
    success: true,
    message: 'Appointment updated successfully',
    data: updatedAppointment
  });
});

const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  if (req.user.role === 'agent' && appointment.agent_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this appointment'
    });
  }

  if (req.user.role === 'user' && appointment.user_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this appointment'
    });
  }

  await Appointment.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Appointment deleted successfully'
  });
});

const getAgentAvailability = asyncHandler(async (req, res) => {
  const { agent_id, date } = req.query;

  const agent = await Agent.findById(agent_id);
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  const targetDate = new Date(date);
  const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

  const agentAvailability = agent.availability[dayOfWeek];
  if (!agentAvailability || !agentAvailability.available) {
    return res.json({
      success: true,
      data: {
        available: false,
        message: 'Agent is not available on this day'
      }
    });
  }

  const existingAppointments = await Appointment.find({
    agent_id,
    appointment_date: {
      $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
      $lt: new Date(targetDate.setHours(23, 59, 59, 999))
    },
    status: { $in: ['scheduled', 'confirmed'] }
  }).select('appointment_date duration');

  const timeSlots = [];
  const startTime = agentAvailability.open ? parseInt(agentAvailability.open.split(':')[0]) : 9;
  const endTime = agentAvailability.close ? parseInt(agentAvailability.close.split(':')[0]) : 17;

  for (let hour = startTime; hour < endTime; hour++) {
    const slotStart = new Date(targetDate);
    slotStart.setHours(hour, 0, 0, 0);
    
    const slotEnd = new Date(targetDate);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const isAvailable = !existingAppointments.some(appointment => {
      const apptStart = new Date(appointment.appointment_date);
      const apptEnd = new Date(apointment.appointment_date.getTime() + (appointment.duration || 60) * 60000);
      
      return (apptStart < slotEnd && apptEnd > slotStart);
    });

    if (isAvailable) {
      timeSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: true
      });
    }
  }

  res.json({
    success: true,
    data: {
      available: true,
      timeSlots,
      workingHours: agentAvailability
    }
  });
});

const getAppointmentStats = asyncHandler(async (req, res) => {
  let filter = {};
  
  if (req.user.role === 'agent') {
    filter.agent_id = req.user.id;
  } else if (req.user.role === 'user') {
    filter.user_id = req.user.id;
  }

  const totalAppointments = await Appointment.countDocuments(filter);
  const scheduledAppointments = await Appointment.countDocuments({ ...filter, status: 'scheduled' });
  const confirmedAppointments = await Appointment.countDocuments({ ...filter, status: 'confirmed' });
  const completedAppointments = await Appointment.countDocuments({ ...filter, status: 'completed' });
  const cancelledAppointments = await Appointment.countDocuments({ ...filter, status: 'cancelled' });
  const noShowAppointments = await Appointment.countDocuments({ ...filter, status: 'no_show' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = await Appointment.countDocuments({
    ...filter,
    appointment_date: { $gte: today, $lt: tomorrow }
  });

  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const recentAppointments = await Appointment.countDocuments({
    ...filter,
    appointment_date: { $gte: thisWeek }
  });

  const upcomingAppointments = await Appointment.countDocuments({
    ...filter,
    appointment_date: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  });

  res.json({
    success: true,
    data: {
      total: totalAppointments,
      scheduled: scheduledAppointments,
      confirmed: confirmedAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      noShow: noShowAppointments,
      today: todayAppointments,
      thisWeek: recentAppointments,
      upcoming: upcomingAppointments
    }
  });
});

const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { new_date, reason } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  if (req.user.role === 'agent' && appointment.agent_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reschedule this appointment'
    });
  }

  if (req.user.role === 'user' && appointment.user_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reschedule this appointment'
    });
  }

  const conflictingAppointment = await Appointment.findOne({
    agent_id: appointment.agent_id,
    appointment_date: {
      $gte: new Date(new_date).getTime() - appointment.duration * 60000,
      $lte: new Date(new_date).getTime() + appointment.duration * 60000
    },
    status: { $in: ['scheduled', 'confirmed'] },
    _id: { $ne: appointment._id }
  });

  if (conflictingAppointment) {
    return res.status(400).json({
      success: false,
      message: 'Agent is not available at this time'
    });
  }

  appointment.appointment_date = new Date(new_date);
  appointment.notes = `${appointment.notes}\n\nRescheduled by ${req.user.role}: ${reason || 'No reason provided'}`;
  await appointment.save();

  await appointment.populate([
    { path: 'user_id', select: 'name email phone' },
    { path: 'property_id', select: 'title location' },
    { path: 'agent_id', populate: { path: 'user_id', select: 'name email' } }
  ]);

  const notificationUser = req.user.role === 'agent' ? appointment.user_id : appointment.agent_id;
  
  await Notification.create({
    user_id: notificationUser,
    title: 'Appointment Rescheduled',
    message: `Appointment has been rescheduled to ${new Date(new_date).toLocaleString()}`,
    type: 'appointment',
    related_id: appointment._id,
    related_model: 'Appointment'
  });

  res.json({
    success: true,
    message: 'Appointment rescheduled successfully',
    data: appointment
  });
});

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAgentAvailability,
  getAppointmentStats,
  rescheduleAppointment
};
