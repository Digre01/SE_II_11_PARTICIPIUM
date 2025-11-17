import { WebSocketServer } from 'ws';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req) => {
    // Qui la logica di autenticazione e gestione messaggi
    ws.on('message', (data) => {
      // Gestione messaggi ricevuti dal client
    });
    ws.on('close', () => {
      // Cleanup alla disconnessione
    });
  });
}
