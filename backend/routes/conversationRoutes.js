import express from 'express';
import { getUserConversations } from '../controllers/conversationController.js';
const router = express.Router();

router.get('/', getUserConversations);

export default router;
