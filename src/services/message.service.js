const Message = require('../models/Message.model');
const Notification = require('../models/Notification.model');
const Assignment = require('../models/Assignment.model');

/**
 * Verifies that senderId and receiverId are currently linked via an
 * active mentor-student assignment (in either direction). This is the
 * enforcement point for "mentors can only message their assigned
 * students, students can only message their assigned mentor."
 */
async function verifyCanMessage(userAId, userBId) {
  const assignment = await Assignment.findOne({
    status: 'active',
    $or: [
      { mentorId: userAId, studentId: userBId },
      { mentorId: userBId, studentId: userAId },
    ],
  });

  if (!assignment) {
    const err = new Error('You are not permitted to message this user.');
    err.statusCode = 403;
    throw err;
  }

  return assignment;
}

async function sendMessage(senderId, receiverId, content) {
  await verifyCanMessage(senderId, receiverId);

  const conversationId = Message.buildConversationId(senderId, receiverId);

  const message = await Message.create({
    senderId,
    receiverId,
    conversationId,
    content,
  });

  await Notification.create({
    userId: receiverId,
    type: 'message',
    title: 'New message',
    body: content.length > 80 ? `${content.slice(0, 80)}...` : content,
    relatedEntityId: message._id,
  });

  return message;
}

async function getConversation(userId, otherUserId) {
  await verifyCanMessage(userId, otherUserId);

  const conversationId = Message.buildConversationId(userId, otherUserId);

  const messages = await Message.find({ conversationId }).sort({ sentAt: 1 });

  // Mark messages sent TO this user as read
  await Message.updateMany(
    { conversationId, receiverId: userId, isRead: false },
    { isRead: true }
  );

  return messages;
}

module.exports = { sendMessage, getConversation, verifyCanMessage };
