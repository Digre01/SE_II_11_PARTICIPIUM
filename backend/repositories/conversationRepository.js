import { AppDataSourcePostgres } from '../config/data-source.js';
import { Conversation } from '../entities/Conversation.js';

export async function getConversationsForUser(userId) {
  const repo = AppDataSourcePostgres.getRepository(Conversation);
  return await repo.createQueryBuilder('conversation')
    .leftJoinAndSelect('conversation.report', 'report')
    .leftJoinAndSelect('conversation.participants', 'participant')
    .where('participant.id = :userId', { userId })
    .getMany();
}

export async function createConversation({ report, participants, isInternal = false }) {
  const repo = AppDataSourcePostgres.getRepository(Conversation);
  const conversationEntity = repo.create({ report, participants, isInternal });
  return await repo.save(conversationEntity);
}

// Aggiungi uno user ai partecipanti di una conversazione
export async function addParticipantToConversation(conversationId, userId) {
  const repo = AppDataSourcePostgres.getRepository(Conversation);
  const conversation = await repo.findOne({
    where: { id: conversationId },
    relations: ['participants']
  });
  if (!conversation) throw new Error('Conversation not found');

  // Controlla se lo user è già tra i partecipanti
  if (conversation.participants.some(u => u.id === userId)) {
    return conversation;
  }

  // Recupera l'utente
  const userRepo = AppDataSourcePostgres.getRepository('Users');
  const user = await userRepo.findOneBy({ id: userId });
  if (!user) throw new Error('User not found');

  conversation.participants.push(user);
  await repo.save(conversation);
  return conversation;
}
