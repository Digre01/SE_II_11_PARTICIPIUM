import { AppDataSourcePostgres } from '../config/data-source.js';
import { Conversation } from '../entities/Conversation.js';

export async function getConversationsForUser(userId) {
  const repo = AppDataSourcePostgres.getRepository(Conversation);
  return await repo.find({ where: { user: { id: userId } }, relations: ['report'] });
}
