/**
 * NoobHub node.js server
 * Opensource multiplayer and network messaging for CoronaSDK, Moai, Gideros & LÖVE
 *
 * @usage
 * $ nodejs node.js
 *
 * @authors
 * Igor Korsakov
 * Sergii Tsegelnyk
 *
 * @license WTFPL
 *
 * https://github.com/Overtorment/NoobHub
 *
 **/

const _SUBS0_ = '__SUBSCRIBE__';
const _SUBS1_ = '__ENDSUBSCRIBE__';
const _JSON0_ = '__JSON__START__';
const _JSON1_ = '__JSON__END__';

const _SUBS0L_ = _SUBS0_.length;
const _SUBS1L_ = _SUBS1_.length;
const _JSON0L_ = _JSON0_.length;
const _JSON1L_ = _JSON1_.length;

const net = require('net');

const cfg = {
  verbose: true, // set to true to capture lots of debug info
  buffer_size: 1024 * 16, // buffer allocated per each socket client
  port: 1337,
  // wsPort: 2337, // uncomment if you want the websocket bridge
  // httpPort: 3337, // uncomment if you want http endpoint to list channel counts
  sendOwnMessagesBack: true // if false, avoids sending own messages back to the sender
};

const sockets = {}; // this is where we store all current client socket connections

function _log() {
  if (cfg.verbose) console.log.apply(console, arguments);
}

function listNumClientsPerChannel() {
  const resp = {};
  for (let [channelName, channelValue] of Object.entries(sockets)) {
    resp[channelName] = Object.keys(channelValue).length;
  }
  return resp;
}

let sendAsWsMessage;
let listNumClientsPerChannelWs;

function listCompoundNumClientsPerChannel() {
  const tcp = listNumClientsPerChannel();
  const ws = listNumClientsPerChannelWs();
  const allChannels = Array.from(
    new Set(Object.keys(tcp).concat(Object.keys(ws)))
  );
  const compound = {};
  for (let k of allChannels) {
    compound[k] = (tcp[k] || 0) + (ws[k] || 0);
  }
  return compound;
}

if (cfg.wsPort) {
  function sendAsTcpMessage(payload, channel) {
    const channelSockets = sockets[channel];
    if (!channelSockets) {
      return;
    }
    const subscribers = Object.values(channelSockets);
    for (let sub of subscribers) {
      sub.isConnected && sub.write(payload);
    }
  }

  const wsOut = require('./ws-server')({
    port: cfg.wsPort,
    verbose: cfg.verbose,
    sendAsTcpMessage,
    sendOwnMessagesBack: cfg.sendOwnMessagesBack
  });
  sendAsWsMessage = wsOut.sendAsWsMessage;
  listNumClientsPerChannelWs = wsOut.listNumClientsPerChannel;
}

if (cfg.httpPort) {
  require('./http-channels-server')({
    port: cfg.httpPort,
    listNumClientsPerChannel: cfg.wsPort
      ? listCompoundNumClientsPerChannel
      : listNumClientsPerChannel
  });
}

const server = net.createServer();

// black magic
process.on('uncaughtException', (err) => {
  _log('Exception: ' + err); // TODO: think we should terminate it on such exception
});

server.on('connection', (socket) => {
  socket.setNoDelay(true);
  socket.setKeepAlive(true, 300 * 1000);
  socket.isConnected = true;
  socket.connectionId = socket.remoteAddress + '-' + socket.remotePort; // unique, used to trim out from sockets hashmap when closing socket
  socket.buffer = Buffer.alloc(cfg.buffer_size);
  socket.buffer.len = 0; // due to Buffer's nature we have to keep track of buffer contents ourself

  _log('New client: ' + socket.remoteAddress + ':' + socket.remotePort);

  socket.on('data', (dataRaw) => {
    // dataRaw is an instance of Buffer as well
    if (dataRaw.length > cfg.buffer_size - socket.buffer.len) {
      _log(
        "Message doesn't fit the buffer. Adjust the buffer size in configuration"
      );
      socket.buffer.len = 0; // trimming buffer
      return false;
    }

    socket.buffer.len += dataRaw.copy(socket.buffer, socket.buffer.len); // keeping track of how much data we have in buffer

    let start;
    let end;
    let str = socket.buffer.slice(0, socket.buffer.len).toString();

    // PROCESS SUBSCRIPTION 1ST
    if (
      (start = str.indexOf(_SUBS0_)) !== -1 &&
      (end = str.indexOf(_SUBS1_)) !== -1
    ) {
      // if socket was on another channel delete the old reference
      if (
        socket.channel &&
        sockets[socket.channel] &&
        sockets[socket.channel][socket.connectionId]
      ) {
        delete sockets[socket.channel][socket.connectionId];
      }
      socket.channel = str.substr(start + _SUBS0L_, end - (start + _SUBS0L_));
      socket.write('Hello. Noobhub online. \r\n');
      _log(
        `TCP Client ${socket.connectionId} subscribes for channel: ${socket.channel}`
      );
      str = str.substr(end + _SUBS1L_); // cut the message and remove the precedant part of the buffer since it can't be processed
      socket.buffer.len = socket.buffer.write(str, 0);
      sockets[socket.channel] = sockets[socket.channel] || {}; // hashmap of sockets  subscribed to the same channel
      sockets[socket.channel][socket.connectionId] = socket;
    }

    let timeToExit = false;
    do {
      // this is for a case when several messages arrived in buffer
      // PROCESS JSON NEXT
      if (
        (start = str.indexOf(_JSON0_)) !== -1 &&
        (end = str.indexOf(_JSON1_)) !== -1
      ) {
        const jsonS = str.substr(start + _JSON0L_, end - (start + _JSON0L_));
        _log(`TCP Client ${socket.connectionId} posts json: ${jsonS}`);
        str = str.substr(end + _JSON1L_); // cut the message and remove the precedant part of the buffer since it can't be processed
        socket.buffer.len = socket.buffer.write(str, 0);

        // broadcast to others in the channel
        const payload = _JSON0_ + jsonS + _JSON1_;

        sendAsWsMessage && sendAsWsMessage(payload, socket.channel);

        const channelSockets = sockets[socket.channel];
        if (channelSockets) {
          const subscribers = Object.values(channelSockets);
          for (let sub of subscribers) {
            if (!cfg.sendOwnMessagesBack && sub === socket) {
              continue;
            }
            sub.isConnected && sub.write(payload);
          }
        }
      } else {
        timeToExit = true;
      } // if no json data found in buffer - then it is time to exit this loop
    } while (!timeToExit);
  }); // end of socket.on 'data'

  socket.on('error', () => {
    return _destroySocket(socket);
  });
  socket.on('close', () => {
    return _destroySocket(socket);
  });
}); // end of server.on 'connection'

function _destroySocket(socket) {
  if (
    !socket.channel ||
    !sockets[socket.channel] ||
    !sockets[socket.channel][socket.connectionId]
  )
    return;
  sockets[socket.channel][socket.connectionId].isConnected = false;
  sockets[socket.channel][socket.connectionId].destroy();
  sockets[socket.channel][socket.connectionId].buffer = null;
  delete sockets[socket.channel][socket.connectionId].buffer;
  delete sockets[socket.channel][socket.connectionId];
  _log(
    `${socket.connectionId} has been disconnected from channel ${socket.channel}`
  );

  if (Object.keys(sockets[socket.channel]).length === 0) {
    delete sockets[socket.channel];
    _log('empty channel wasted');
  }
}

server.on('listening', () => {
  console.log(
    `NoobHub on ${server.address().address}:${server.address().port}`
  );
});

server.listen(cfg.port, '::');
