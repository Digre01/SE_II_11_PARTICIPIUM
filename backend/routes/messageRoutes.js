import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';
const router = express.Router();
import { authorizeUserType } from '../middlewares/userAuthorization.js';

router.get('/:conversationId/messages', authorizeUserType(['citizen', 'STAFF']), getMessages);
router.post('/:conversationId/messages', authorizeUserType(['STAFF']), sendMessage);

export default router;
