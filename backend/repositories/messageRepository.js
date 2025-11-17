import { AppDataSourcePostgres } from '../config/data-source.js';
import { Message } from '../entities/Message.js';

export async function getMessagesForConversation(conversationId, userId) {
  const repo = AppDataSourcePostgres.getRepository(Message);
  // Verifica che l'utente sia partecipante, poi restituisci i messaggi
  return await repo.find({ where: { conversation: { id: conversationId } }, relations: ['sender'] });
}

export async function createMessage(conversationId, userId, content) {
  const repo = AppDataSourcePostgres.getRepository(Message);
  const message = repo.create({ conversation: { id: conversationId }, sender: { id: userId }, content });
  return await repo.save(message);
}
