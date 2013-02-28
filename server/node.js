/**
 * NoobHub node.js server
 *
 * @usage node node.js
 * configurate port number and buffer size
 * according to your needs
 *
 * @authors
 * Igor Korsakov
 * Sergii Tsegelnyk
 *
 * @license WTFPL
 */

var server = require('net').createServer()
    ,sockets = {}  // this is where we store all current client socket connections
    , cfg = {
        port: 1337,
        buffer_size: 1024*8,
        verbose: true
    },
    _log = function(){
        if (cfg.verbose && console)
            console.log.apply(console, arguments);
    };

// uncomment this line if you want to test this in cloud9
//cfg.port = process.env.port;

// black magic
process.on('uncaughtException', function(err){
    _log('Caught an Uncaught Exception!');
    _log(err);
    process.exit(1);
});

server.on('connection', function(socket) {
    socket.setNoDelay(true);
    socket.connection_id = require('crypto').createHash('sha1').update( 'noobhub'  + Date.now() + Math.random() ).digest('hex') ; // unique sha1 hash generation
    socket.channel = '';
    socket.buffer = new Buffer(cfg.buffer_size);
    socket.buffer.len = 0; // due to Buffer's nature we have to keep track of buffer contents ourself

    _log('New client: ' + socket.remoteAddress +':'+ socket.remotePort);

    socket.on('data', function(data_raw) { // data_raw is an instance of Buffer as well
        // if message length in bigger than total buffer length - give a warning and don't process the data
        if (data_raw.length > cfg.buffer_size) {
            throw("Your message size is bigger than the maximum buffer size. Adjust the buffer size in configuration");
        }
        // if message does not fit the buffer, but can actually fit it - remove a portion of data from the beginning
        else if (data_raw.length > (cfg.buffer_size - socket.buffer.len)) {
            var needed_space = data_raw.length - (cfg.buffer_size - socket.buffer.len);
            socket.buffer = socket.buffer.slice(0, needed_space);
            socket.buffer.len -= needed_space;
        }

        try {
            data_raw.copy(socket.buffer, socket.buffer.len);
        } catch(e) {
            _log('buffer copy error: ', e);
        }

        socket.buffer.len +=  data_raw.length; // now let's assume that all data was written to buffer w/o owerflow

        var str, start, end
            , conn_id = socket.connection_id;
        str = socket.buffer.slice(0,socket.buffer.len).toString();

        if ( (start = str.indexOf("__SUBSCRIBE__")) !=  -1   &&   (end = str.indexOf("__ENDSUBSCRIBE__"))  !=  -1) {
            socket.channel = str.substr( start+13,  end-(start+13) );
            socket.write('Hello. Noobhub online. \r\n');
            _log("Client subscribes for channel: " + socket.channel);
            str = str.substr(end + 16);  // cut the message and remove the precedant part of the buffer since it can't be processed
            socket.buffer.len = socket.buffer.write(str,0);
            sockets[socket.channel] = sockets[socket.channel] || {}; // hashmap of sockets  subscribed to the same channel
            sockets[socket.channel][conn_id] = socket;
        }

        var time_to_exit = true;
        do{  // this is for a case when several messages arrived in buffer
            if ( (start = str.indexOf("__JSON__START__")) !=  -1   &&  (end = str.indexOf("__JSON__END__"))  !=  -1 ) {
                var json = str.substr( start+15,  end-(start+15) );
                _log("Client posts json:  " + json);
                str = str.substr(end + 13);  // cut the message and remove the precedant part of the buffer since it can't be processed
                socket.buffer.len = socket.buffer.write(str,0);
                for (var prop in sockets[socket.channel]) {

                    if (sockets[socket.channel].hasOwnProperty(prop)) {
                        sockets[socket.channel][prop].write("__JSON__START__" + json + "__JSON__END__");
                    }
                } // writing this message to all sockets with the same channel

                time_to_exit = false;
            } else {  time_to_exit = true; } // if no json data found in buffer - then it is time to exit this loop
        } while ( !time_to_exit );
    }); // end of  socket.on 'data'

    socket.on('close', function(){  // we need to cut out closed socket from array of client socket connections
        if  (!socket.channel   ||   !sockets[socket.channel])  return;
        delete sockets[socket.channel][socket.connection_id];
        _log(socket.connection_id + " has been disconnected from channel " + socket.channel);
    }); // end of socket.on 'close'

    socket.on('error', function(){ // error handling, event 'close' will be called automatically @see http://nodejs.org/api/net.html#net_event_close_1
        if (socket.channel && sockets[socket.channel]) {
            delete sockets[socket.channel][socket.connection_id];
        }
        _log(socket.connection_id + ' will be closed due to the error');
        _log(arguments);
    });

}); //  end of server.on 'connection'

server.on('error', function (e) { // error handling, event 'close' will be called automatically @see http://nodejs.org/api/net.html#net_event_error
    _log('server error :');
    _log(e);
});

server.on('close', function(){
    _log('All connections are stopped and server is closed');
});

server.listen(cfg.port);
console.log('NoobHub on ' + server.address().address +':'+ server.address().port);