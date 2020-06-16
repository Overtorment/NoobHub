const _SUBS0_ = '__SUBSCRIBE__';
const _SUBS1_ = '__ENDSUBSCRIBE__';
const _JSON0_ = '__JSON__START__';
const _JSON1_ = '__JSON__END__';

const _SUBS0L_ = _SUBS0_.length;
const _SUBS1L_ = _SUBS1_.length;
const _JSON0L_ = _JSON0_.length;

const WebSocket = require('ws');

function wsServerHook({
  port,
  verbose,
  sendAsTcpMessage,
  sendOwnMessagesBack
}) {
  const wss = new WebSocket.Server({ port });
  console.log(`... and on :${port} for ws`);

  function _log() {
    if (verbose) console.log.apply(console, arguments);
  }

  const sockets = {}; // channel [connectionId]

  wss.on('connection', (ws) => {
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
        (start = str.indexOf(_SUBS0_)) !== -1 &&
        (end = str.indexOf(_SUBS1_)) !== -1
      ) {
        ws.channel = str.substr(start + _SUBS0L_, end - (start + _SUBS0L_));

        ws.send('Hello. Noobhub online. \r\n');
        _log(
          `WS Client ${ws.connectionId} subscribes for channel: ${ws.channel}`
        );

        str = str.substr(end + _SUBS1L_);

        sockets[ws.channel] = sockets[ws.channel] || {}; // hashmap of sockets  subscribed to the same channel
        sockets[ws.channel][ws.connectionId] = ws;
      }

      if (
        (start = str.indexOf(_JSON0_)) !== -1 &&
        (end = str.indexOf(_JSON1_)) !== -1
      ) {
        const json = str.substr(start + _JSON0L_, end - (start + _JSON0L_));
        _log(`WS Client ${ws.connectionId} posts json: ${json}`);

        const payload = _JSON0_ + json + _JSON1_;

        sendAsTcpMessage(payload, ws.channel);

        const channelSockets = sockets[ws.channel];
        if (!channelSockets) {
          return;
        }
        const subscribers = Object.values(channelSockets);
        for (let sub of subscribers) {
          if (!sendOwnMessagesBack && sub === ws) {
            continue;
          }
          sub.isConnected && sub.send(payload);
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

  return {
    sendAsWsMessage
  };
}

module.exports = wsServerHook;
