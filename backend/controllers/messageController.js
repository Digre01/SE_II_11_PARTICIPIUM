import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { getMessagesForConversation, sendStaffMessage } from '../repositories/messageRepository.js';

export async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const messages = await getMessagesForConversation(conversationId, req.user.id);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req, res, next) {
  try {
    
    const { conversationId } = req.params;
    const { content } = req.body;

    const message = await sendStaffMessage(conversationId, req.user.id, content);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}
