const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const { conversation_id, unread_only } = req.query;

  let filter = {
    $or: [
      { sender_id: req.user.id },
      { receiver_id: req.user.id }
    ]
  };

  if (conversation_id) {
    filter.conversation_id = conversation_id;
  }

  if (unread_only === 'true') {
    filter.is_read = false;
    filter.receiver_id = req.user.id;
  }

  const messages = await Message.find(filter)
    .populate([
      { path: 'sender_id', select: 'name profile_image' },
      { path: 'receiver_id', select: 'name profile_image' },
      { path: 'property_id', select: 'title' }
    ])
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 });

  const total = await Message.countDocuments(filter);

  res.json({
    success: true,
    data: messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const getMessageById = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id)
    .populate([
      { path: 'sender_id', select: 'name profile_image' },
      { path: 'receiver_id', select: 'name profile_image' },
      { path: 'property_id', select: 'title' }
    ]);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  if (message.sender_id._id.toString() !== req.user.id && 
      message.receiver_id._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this message'
    });
  }

  if (message.receiver_id._id.toString() === req.user.id && !message.is_read) {
    message.is_read = true;
    message.read_at = new Date();
    await message.save();
  }

  res.json({
    success: true,
    data: message
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { receiver_id, message, message_type, property_id } = req.body;

  if (receiver_id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot send message to yourself'
    });
  }

  const receiver = await User.findById(receiver_id);
  if (!receiver || !receiver.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Receiver not found or inactive'
    });
  }

  const conversation_id = [req.user.id, receiver_id].sort().join('-');

  const newMessage = await Message.create({
    sender_id: req.user.id,
    receiver_id,
    message,
    message_type: message_type || 'text',
    property_id,
    conversation_id
  });

  await newMessage.populate([
    { path: 'sender_id', select: 'name profile_image' },
    { path: 'receiver_id', select: 'name profile_image' },
    { path: 'property_id', select: 'title' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: newMessage
  });
});

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender_id: mongoose.Types.ObjectId(req.user.id) },
          { receiver_id: mongoose.Types.ObjectId(req.user.id) }
        ]
      }
    },
    {
      $group: {
        _id: '$conversation_id',
        lastMessage: { $last: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver_id', mongoose.Types.ObjectId(req.user.id)] },
                  { $eq: ['$is_read', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { 'lastMessage.created_at': -1 } }
  ]);

  const populatedConversations = await Message.populate(conversations, [
    {
      path: 'lastMessage.sender_id',
      select: 'name profile_image'
    },
    {
      path: 'lastMessage.receiver_id',
      select: 'name profile_image'
    },
    {
      path: 'lastMessage.property_id',
      select: 'title'
    }
  ]);

  res.json({
    success: true,
    data: populatedConversations
  });
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { conversation_id } = req.body;

  await Message.updateMany(
    {
      conversation_id,
      receiver_id: req.user.id,
      is_read: false
    },
    {
      is_read: true,
      read_at: new Date()
    }
  );

  res.json({
    success: true,
    message: 'Messages marked as read'
  });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  if (message.sender_id.toString() !== req.user.id && 
      message.receiver_id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this message'
    });
  }

  if (message.sender_id.toString() === req.user.id) {
    message.is_deleted_by_sender = true;
  } else {
    message.is_deleted_by_receiver = true;
  }

  if (message.is_deleted_by_sender && message.is_deleted_by_receiver) {
    await Message.findByIdAndDelete(req.params.id);
  } else {
    await message.save();
  }

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Message.countDocuments({
    receiver_id: req.user.id,
    is_read: false
  });

  res.json({
    success: true,
    data: { unreadCount }
  });
});

router.use(protect);

router.get('/', getMessages);
router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/:id', getMessageById);
router.post('/', sendMessage);
router.put('/mark-read', markMessagesAsRead);
router.delete('/:id', deleteMessage);

module.exports = router;
