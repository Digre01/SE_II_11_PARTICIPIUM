import {
  createNotification,
  getUnreadNotifications,
  markNotificationsAsReadForConversation,
  getUnreadCountByConversation
} from '../repositories/notificationRepository.js';

export async function getUserNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const notifications = await getUnreadNotifications(userId);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCounts(req, res, next) {
  try {
    const userId = req.user.id;
    const counts = await getUnreadCountByConversation(userId);
    res.json(counts);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const updated = await markNotificationsAsReadForConversation(userId, conversationId);
    res.json({ updated });
  } catch (err) {
    next(err);
  }
}
