import { AppDataSourcePostgres } from '../config/data-source.js';
import { Message } from '../entities/Message.js';
import { Conversation } from '../entities/Conversation.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { InsufficientRightsError } from '../errors/InsufficientRightsError.js';

export async function getMessagesForConversation(conversationId, userId) {
  const repo = AppDataSourcePostgres.getRepository(Message);
  const convRepo = AppDataSourcePostgres.getRepository(Conversation);
  // Verifica che l'utente sia tra i partecipanti
  const conversation = await convRepo.findOne({
    where: { id: conversationId },
    relations: ['participants']
  });
  if (!conversation) throw new NotFoundError('Conversation not found');
  const isParticipant = conversation.participants.some(p => String(p.id) === String(userId));
  if (!isParticipant) throw new InsufficientRightsError('Forbidden: user not in conversation');
  return await repo.find({ where: { conversation: { id: conversationId } }, relations: ['sender'] });
}

export async function createMessage(conversationId, userId, content) {
  const repo = AppDataSourcePostgres.getRepository(Message);
  const message = repo.create({ conversation: { id: conversationId }, sender: { id: userId }, content });
  return await repo.save(message);
}

export async function createSystemMessage(conversationId, content) {
  const repo = AppDataSourcePostgres.getRepository(Message);
  const message = repo.create({ conversation: { id: conversationId }, sender: null, content, isSystem: true });
  return await repo.save(message);
}
