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

var server = require('net').createServer()
var sockets = {}  // this is where we store all current client socket connections
var cfg = {
  port: 1337,
  buffer_size: 1024 * 16, // buffer allocated per each socket client
  verbose: false // set to true to capture lots of debug info
}
var _log = function () {
  if (cfg.verbose) console.log.apply(console, arguments)
}

// black magic
process.on('uncaughtException', function (err) {
  _log('Exception: ' + err) // TODO: think we should terminate it on such exception
})

server.on('connection', function (socket) {
  socket.setNoDelay(true)
  socket.setKeepAlive(true, 300 * 1000)
  socket.isConnected = true
  socket.connectionId = socket.remoteAddress + '-' + socket.remotePort // unique, used to trim out from sockets hashmap when closing socket
  socket.buffer = new Buffer(cfg.buffer_size)
  socket.buffer.len = 0 // due to Buffer's nature we have to keep track of buffer contents ourself

  _log('New client: ' + socket.remoteAddress + ':' + socket.remotePort)

  socket.on('data', function (dataRaw) { // dataRaw is an instance of Buffer as well
    if (dataRaw.length > (cfg.buffer_size - socket.buffer.len)) {
      _log("Message doesn't fit the buffer. Adjust the buffer size in configuration")
      socket.buffer.len = 0 // trimming buffer
      return false
    }

    socket.buffer.len += dataRaw.copy(socket.buffer, socket.buffer.len) // keeping track of how much data we have in buffer

    var start
    var end
    var str = socket.buffer.slice(0, socket.buffer.len).toString()

    if ((start = str.indexOf('__SUBSCRIBE__')) !== -1 && (end = str.indexOf('__ENDSUBSCRIBE__')) !== -1) {
      // if socket was on another channel delete the old reference
      if (socket.channel && sockets[socket.channel] && sockets[socket.channel][socket.connectionId]) {
        delete sockets[socket.channel][socket.connectionId]
      }
      socket.channel = str.substr(start + 13, end - (start + 13))
      socket.write('Hello. Noobhub online. \r\n')
      _log('Client subscribes for channel: ' + socket.channel)
      str = str.substr(end + 16)  // cut the message and remove the precedant part of the buffer since it can't be processed
      socket.buffer.len = socket.buffer.write(str, 0)
      sockets[socket.channel] = sockets[socket.channel] || {} // hashmap of sockets  subscribed to the same channel
      sockets[socket.channel][ socket.connectionId ] = socket
    }

    var timeToExit = true
    do {  // this is for a case when several messages arrived in buffer
      if ((start = str.indexOf('__JSON__START__')) !== -1 && (end = str.indexOf('__JSON__END__')) !== -1) {
        var json = str.substr(start + 15, end - (start + 15))
        _log('Client posts json:  ' + json)
        str = str.substr(end + 13)  // cut the message and remove the precedant part of the buffer since it can't be processed
        socket.buffer.len = socket.buffer.write(str, 0)
        var subscribers = Object.keys(sockets[socket.channel])
        for (var i = 0, l = subscribers.length; i < l; i++) {
          sockets[socket.channel][ subscribers[i] ].isConnected && sockets[socket.channel][ subscribers[i] ].write('__JSON__START__' + json + '__JSON__END__')
        } // writing this message to all sockets with the same channel
        timeToExit = false
      } else { timeToExit = true } // if no json data found in buffer - then it is time to exit this loop
    } while (!timeToExit)
  }) // end of  socket.on 'data'

  socket.on('error', function () { return _destroySocket(socket) })
  socket.on('close', function () { return _destroySocket(socket) })
}) //  end of server.on 'connection'

var _destroySocket = function (socket) {
  if (!socket.channel || !sockets[socket.channel] || !sockets[socket.channel][socket.connectionId]) return
  sockets[socket.channel][socket.connectionId].isConnected = false
  sockets[socket.channel][socket.connectionId].destroy()
  sockets[socket.channel][socket.connectionId].buffer = null
  delete sockets[socket.channel][socket.connectionId].buffer
  delete sockets[socket.channel][socket.connectionId]
  _log(socket.connectionId + ' has been disconnected from channel ' + socket.channel)

  if (Object.keys(sockets[socket.channel]).length === 0) {
    delete sockets[socket.channel]
    _log('empty channel wasted')
  }
}

server.on('listening', function () { console.log('NoobHub on ' + server.address().address + ':' + server.address().port) })
server.listen(cfg.port, '::')

