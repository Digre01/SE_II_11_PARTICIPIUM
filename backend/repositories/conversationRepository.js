import { AppDataSourcePostgres } from '../config/data-source.js';
import { Conversation } from '../entities/Conversation.js';

export async function getConversationsForUser(userId) {
  const repo = AppDataSourcePostgres.getRepository(Conversation);
  // Trova tutte le conversazioni dove l'utente è tra i partecipanti
  return await repo.find({
    where: qb => {
      qb.where('participants.id = :userId', { userId });
    },
    relations: ['report', 'participants']
  });
}

export async function createConversation({ report, participants }) {
  const repo = AppDataSourcePostgres.getRepository(Conversation);
  const conversationEntity = repo.create({ report, participants });
  return await repo.save(conversationEntity);
}
