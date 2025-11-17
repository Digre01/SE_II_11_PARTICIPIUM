import { AppDataSourcePostgres } from '../config/data-source.js';
import { Conversation } from '../entities/Conversation.js';

export async function getConversationsForUser(userId) {
  const repo = AppDataSourcePostgres.getRepository(Conversation);
  // Usa query builder per filtrare correttamente le conversazioni dove l'utente è partecipante
  return await repo.createQueryBuilder('conversation')
    .leftJoinAndSelect('conversation.report', 'report')
    .leftJoinAndSelect('conversation.participants', 'participant')
    .where('participant.id = :userId', { userId })
    .getMany();
}

export async function createConversation({ report, participants }) {
  const repo = AppDataSourcePostgres.getRepository(Conversation);
  const conversationEntity = repo.create({ report, participants });
  return await repo.save(conversationEntity);
}
