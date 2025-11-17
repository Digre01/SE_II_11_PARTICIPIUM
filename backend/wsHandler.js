import { WebSocketServer } from 'ws';
import cookie from 'cookie';
import { sessionMiddleware } from './config/session.js';
import passport from './config/passport.js';

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

    ws.on('message', (data) => {
      // Gestisci i messaggi
    });

    ws.on('close', () => {
      // Cleanup
    });
  });

  return wss; // Opzionale: ritorna wss se ti serve altrove
}