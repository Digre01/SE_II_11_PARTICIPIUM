import express from 'express';
import { getUserConversations } from '../controllers/conversationController.js';
const router = express.Router();
import { authorizeUserType } from '../middlewares/userAuthorization.js';

router.get('/', authorizeUserType(['citizen', 'staff']), getUserConversations);

export default router;
