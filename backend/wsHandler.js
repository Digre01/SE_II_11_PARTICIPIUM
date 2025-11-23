import { WebSocketServer } from 'ws';
import cookie from 'cookie';
import { sessionMiddleware } from './config/session.js';
import passport from './config/passport.js';
import { createMessage, createSystemMessage } from './repositories/messageRepository.js';
import { createNotification } from './repositories/notificationRepository.js';
import { AppDataSourcePostgres } from './config/data-source.js';
import { Conversation } from './entities/Conversation.js';

// Mappa globale: userId -> array di ws
const userSockets = new Map();

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws') {
      const cookies = cookie.parse(req.headers.cookie || '');
      req.cookies = cookies;

      sessionMiddleware(req, {}, () => {
        passport.initialize()(req, {}, () => {
          passport.authenticate('session')(req, {}, () => {
            if (!req.session || !req.session.passport?.user) {
              socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
              socket.destroy();
              return;
            }
            wss.handleUpgrade(req, socket, head, (ws) => {
              wss.emit('connection', ws, req);
            });
          });
        });
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req) => {
    const userId = req.session.passport.user;
    ws.userId = userId;

    // Registrazione: aggiungi ws alla mappa
    if (!userSockets.has(userId)) userSockets.set(userId, []);
    userSockets.get(userId).push(ws);

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        const { conversationId, content } = msg;
        // Salva il messaggio nel DB
        const savedMsg = await createMessage(conversationId, userId, content);
        // Broadcast ai partecipanti
        broadcastToConversation(conversationId, savedMsg);
      } catch (err) {
        ws.send(JSON.stringify({ error: 'Invalid message format or server error.' }));
      }
    });

    ws.on('close', () => {
      // Cleanup: rimuovi ws dalla mappa
      const arr = userSockets.get(userId);
      if (arr) {
        const idx = arr.indexOf(ws);
        if (idx !== -1) arr.splice(idx, 1);
        if (arr.length === 0) userSockets.delete(userId);
      }
    });
  });

}

// Funzione di broadcast ai partecipanti di una conversazione
export async function broadcastToConversation(conversationId, messageObj) {
  const repo = AppDataSourcePostgres.getRepository(Conversation);
  const conv = await repo.findOne({ where: { id: conversationId }, relations: ['participants'] });
  if (!conv) return;
  for (const participant of conv.participants) {
    // Se sender è presente, escludi solo lui. Se sender è null, tutti ricevono la notifica.
    if (!messageObj.sender || !messageObj.sender.id || String(participant.id) !== String(messageObj.sender.id)) {
      try {
        await createNotification(participant.id, messageObj.id);
      } catch (e) {
        console.error('Error creating notification:', e);
      }
    }
    const sockets = userSockets.get(participant.id);
    if (sockets) {
      for (const ws of sockets) {
        ws.send(JSON.stringify({ message: messageObj }));
      }
    }
  }
}