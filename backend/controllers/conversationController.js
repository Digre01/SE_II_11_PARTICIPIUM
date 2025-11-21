import { getConversationsForUser } from '../repositories/conversationRepository.js';

export async function getUserConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const conversations = await getConversationsForUser(userId);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
}
