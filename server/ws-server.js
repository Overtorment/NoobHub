const WebSocket = require('ws'); // npm install ws

function wsServerHook({ port, verbose, sendAsTcpMessage }) {
  const wss = new WebSocket.Server({ port });
  console.log(`... and on :${port} for ws`);

  function _log() {
    if (verbose) console.log.apply(console, arguments);
  }

  const sockets = {}; // channel [connectionId]

  wss.on('connection', (ws, req) => {
    const remoteAddress = ws._socket.remoteAddress;
    const remotePort = ws._socket.remotePort;
    _log(`New client: ${remoteAddress}:${remotePort}`);

    ws.isConnected = true;
    ws.connectionId = `${remoteAddress}-${remotePort}`;

    ws.on('message', (str) => {
      let start;
      let end;

      // PROCESS SUBSCRIPTION 1ST
      if (
        (start = str.indexOf('__SUBSCRIBE__')) !== -1 &&
        (end = str.indexOf('__ENDSUBSCRIBE__')) !== -1
      ) {
        ws.channel = str.substr(start + 13, end - (start + 13));

        ws.send('Hello. Noobhub online. \r\n');
        _log(
          `WS Client ${ws.connectionId} subscribes for channel: ${ws.channel}`
        );

        str = str.substr(end + 16);

        sockets[ws.channel] = sockets[ws.channel] || {}; // hashmap of sockets  subscribed to the same channel
        sockets[ws.channel][ws.connectionId] = ws;
      }

      if (
        (start = str.indexOf('__JSON__START__')) !== -1 &&
        (end = str.indexOf('__JSON__END__')) !== -1
      ) {
        const json = str.substr(start + 15, end - (start + 15));
        _log(`WS Client ${ws.connectionId} posts json: ${json}`);

        const payload = '__JSON__START__' + json + '__JSON__END__';

        sendAsTcpMessage(payload, ws.channel);

        const channelSockets = sockets[ws.channel];
        if (!channelSockets) {
          return;
        }
        const subscribers = Object.values(channelSockets);
        for (let sub of subscribers) {
          sub.isConnected && sub !== ws && sub.send(payload);
        }
      }
    });

    function _destroySocket(socket) {
      if (
        !socket.channel ||
        !sockets[socket.channel] ||
        !sockets[socket.channel][socket.connectionId]
      )
        return;
      sockets[socket.channel][socket.connectionId].isConnected = false;
      delete sockets[socket.channel][socket.connectionId];
      _log(
        `${socket.connectionId} has been disconnected from channel ${socket.channel}`
      );

      if (Object.keys(sockets[socket.channel]).length === 0) {
        delete sockets[socket.channel];
        _log('empty channel wasted');
      }
    }

    ws.on('close', () => {
      _destroySocket(ws);
    });
  });

  function sendAsWsMessage(payload, channel) {
    const channelSockets = sockets[channel];
    if (!channelSockets) {
      return;
    }
    const subscribers = Object.values(channelSockets);
    for (let sub of subscribers) {
      sub.isConnected && sub.send(payload);
    }
  }

  return sendAsWsMessage;
}

module.exports = wsServerHook;
