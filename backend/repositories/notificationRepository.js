import { AppDataSourcePostgres } from '../config/data-source.js';
import { Notification } from '../entities/Notification.js';

export async function createNotification(userId, messageId) {
  const repo = AppDataSourcePostgres.getRepository(Notification);
  const notification = repo.create({ user: { id: userId }, message: { id: messageId } });
  return await repo.save(notification);
}

export async function getUnreadNotifications(userId) {
  const repo = AppDataSourcePostgres.getRepository(Notification);
  return await repo.find({
    where: { user: { id: userId }, read: false },
    relations: ['message', 'message.conversation']
  });
}

export async function markNotificationsAsReadForConversation(userId, conversationId) {
  const repo = AppDataSourcePostgres.getRepository(Notification);
  const notifications = await repo.find({
    where: qb => {
      qb.where('Notification.read = false')
        .andWhere('Notification.userId = :userId', { userId })
        .andWhere('message.conversationId = :conversationId', { conversationId });
    },
    relations: ['message']
  });
  for (const n of notifications) {
    n.read = true;
    await repo.save(n);
  }
  return notifications.length;
}

export async function getUnreadCountByConversation(userId) {
  const repo = AppDataSourcePostgres.getRepository(Notification);
  const notifications = await repo.find({
    where: { user: { id: userId }, read: false },
    relations: ['message', 'message.conversation']
  });
  // Raggruppa per conversationId
  const counts = {};
  for (const n of notifications) {
    const convId = n.message.conversation.id;
    counts[convId] = (counts[convId] || 0) + 1;
  }
  return counts;
}
