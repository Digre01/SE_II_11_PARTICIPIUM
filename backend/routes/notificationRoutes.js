import express from 'express';
import { getUserNotifications, getUnreadCounts, markAsRead } from '../controllers/notificationController.js';
import { authorizeUserType } from '../middlewares/userAuthorization.js';

const router = express.Router();

// Restituisce tutte le notifiche non lette dell'utente
router.get('/', authorizeUserType(['citizen', 'STAFF']), getUserNotifications);
// Restituisce il conteggio delle notifiche non lette per conversazione
router.get('/counts', authorizeUserType(['citizen', 'STAFF']), getUnreadCounts);
// Segna come lette tutte le notifiche di una conversazione
router.post('/:conversationId/read', authorizeUserType(['citizen', 'STAFF']), markAsRead);

export default router;
