const Notification = require('../models/Notification');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

const createNotification = async (userId, title, message, type, relatedId = null, relatedModel = null, priority = 'medium') => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      related_id: relatedId,
      related_model: relatedModel,
      priority
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const sendBulkNotifications = async (userIds, title, message, type, relatedId = null, relatedModel = null) => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      related_id: relatedId,
      related_model: relatedModel
    }));

    const createdNotifications = await Notification.insertMany(notifications);
    return createdNotifications;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};

const markNotificationsAsRead = async (userId, notificationIds = null) => {
  try {
    let filter = { user_id: userId, is_read: false };
    
    if (notificationIds) {
      filter._id = { $in: notificationIds };
    }

    const result = await Notification.updateMany(
      filter,
      { is_read: true, read_at: new Date() }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      user_id: userId,
      is_read: false
    });

    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

const getUserNotifications = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    type = null,
    is_read = null,
    priority = null
  } = options;

  const skip = (page - 1) * limit;

  try {
    let filter = { user_id: userId };
    
    if (type) filter.type = type;
    if (is_read !== null) filter.is_read = is_read;
    if (priority) filter.priority = priority;

    const notifications = await Notification.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    const total = await Notification.countDocuments(filter);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

const deleteExpiredNotifications = async () => {
  try {
    const result = await Notification.deleteMany({
      expires_at: { $lt: new Date() }
    });

    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting expired notifications:', error);
    throw error;
  }
};

const deleteNotification = async (userId, notificationId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user_id: userId
    });

    return notification;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

const sendPropertyInquiryNotification = async (agentId, propertyId, inquiryId) => {
  try {
    const agent = await User.findById(agentId);
    if (!agent) return null;

    const notification = await createNotification(
      agentId,
      'New Property Inquiry',
      'You have received a new inquiry for your property',
      'inquiry',
      inquiryId,
      'Inquiry',
      'high'
    );

    return notification;
  } catch (error) {
    console.error('Error sending property inquiry notification:', error);
    throw error;
  }
};

const sendAppointmentNotification = async (agentId, appointmentId, type = 'scheduled') => {
  try {
    const agent = await User.findById(agentId);
    if (!agent) return null;

    let title, message;
    switch (type) {
      case 'scheduled':
        title = 'New Appointment Scheduled';
        message = 'A new appointment has been scheduled';
        break;
      case 'confirmed':
        title = 'Appointment Confirmed';
        message = 'An appointment has been confirmed';
        break;
      case 'cancelled':
        title = 'Appointment Cancelled';
        message = 'An appointment has been cancelled';
        break;
      case 'completed':
        title = 'Appointment Completed';
        message = 'An appointment has been completed';
        break;
      default:
        title = 'Appointment Update';
        message = 'There is an update to your appointment';
    }

    const notification = await createNotification(
      agentId,
      title,
      message,
      'appointment',
      appointmentId,
      'Appointment',
      'medium'
    );

    return notification;
  } catch (error) {
    console.error('Error sending appointment notification:', error);
    throw error;
  }
};

const sendReviewNotification = async (targetUserId, reviewId, type = 'property') => {
  try {
    const user = await User.findById(targetUserId);
    if (!user) return null;

    const reviewType = type === 'property' ? 'Property' : 'Agent';
    const notification = await createNotification(
      targetUserId,
      `New ${reviewType} Review`,
      `You have received a new ${reviewType.toLowerCase()} review`,
      'review',
      reviewId,
      'Review',
      'medium'
    );

    return notification;
  } catch (error) {
    console.error('Error sending review notification:', error);
    throw error;
  }
};

const sendSystemNotification = async (userIds, title, message, priority = 'medium') => {
  try {
    const notifications = await sendBulkNotifications(
      userIds,
      title,
      message,
      'system',
      null,
      null,
      priority
    );

    return notifications;
  } catch (error) {
    console.error('Error sending system notification:', error);
    throw error;
  }
};

const sendMarketingNotification = async (userIds, title, message) => {
  try {
    const notifications = await sendBulkNotifications(
      userIds,
      title,
      message,
      'marketing',
      null,
      null,
      'low'
    );

    return notifications;
  } catch (error) {
    console.error('Error sending marketing notification:', error);
    throw error;
  }
};

const getNotificationStats = async (userId) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { user_id: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] } },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              count: 1
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, unread: 0, byType: [], byPriority: [] };

    const typeStats = {};
    result.byType.forEach(item => {
      typeStats[item.type] = (typeStats[item.type] || 0) + 1;
    });

    const priorityStats = {};
    result.byPriority.forEach(item => {
      priorityStats[item.priority] = (priorityStats[item.priority] || 0) + 1;
    });

    return {
      total: result.total,
      unread: result.unread,
      byType: typeStats,
      byPriority: priorityStats
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw error;
  }
};

const cleanupOldNotifications = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      created_at: { $lt: cutoffDate },
      is_read: true
    });

    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendBulkNotifications,
  markNotificationsAsRead,
  getUnreadNotificationCount,
  getUserNotifications,
  deleteExpiredNotifications,
  deleteNotification,
  sendPropertyInquiryNotification,
  sendAppointmentNotification,
  sendReviewNotification,
  sendSystemNotification,
  sendMarketingNotification,
  getNotificationStats,
  cleanupOldNotifications
};
