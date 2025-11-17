import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';
const router = express.Router();

router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);

export default router;
