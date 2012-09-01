var server = require('net').createServer()
	,sockets = {}  // this is where we store all current client socket connections
	, cfg = {
		port: 1337,
		buffer_size: 1024*8
	};

server.on('connection', function(socket) {
    socket.setNoDelay(true);
    socket.connection_id = require('crypto').createHash('sha1').update( 'noobhub'  + Date.now() + Math.random() ).digest('hex') ; // unique sha1 hash generation
    socket.channel = '';
    socket.buffer = new Buffer(cfg.buffer_size);
    socket.buffer.len = 0; // due to Buffer's nature we have to keep track of buffer contents ourself

    console.log('New client: ' + socket.remoteAddress +':'+ socket.remotePort);

    socket.on('data', function(data_raw) { // data_raw is an instance of Buffer as well
			data_raw.copy(socket.buffer, socket.buffer.len);
			socket.buffer.len +=  data_raw.length; // assume all data was written to buffer w/o owerflow

            var str, start, end;
            str = socket.buffer.slice(0,socket.buffer.len).toString();

            if ( (start = str.indexOf("__SUBSCRIBE__")) !=  -1   &&   (end = str.indexOf("__ENDSUBSCRIBE__"))  !=  -1) {
                socket.channel = str.substr( start+13,  end-(start+13) );
                socket.write('Hello. Noobhub online. \r\n');
                console.log("Client subscribes for channel: " + socket.channel);
                str = str.substr(0,start) + str.substr(end + 16);  // cut
                socket.buffer.len = socket.buffer.write(str,0);
                sockets[socket.channel] = sockets[socket.channel] || []; // array of sockets  subscribed to the same channel
                sockets[socket.channel].push(socket);
            }

            var time_to_exit = true;
            do{  // this is for a case when several messages arrived in buffer
                if ( (start = str.indexOf("__JSON__START__")) !=  -1   &&  (end = str.indexOf("__JSON__END__"))  !=  -1 ) {
                    clean_buffer_flag = true;
                    var json = str.substr( start+15,  end-(start+15) );
                    console.log("Client posts json:  " + json);
                    str = str.substr(0,start) + str.substr(end + 13);  // cut
                    socket.buffer.len = socket.buffer.write(str,0);
                    for (var c=0, l=sockets[socket.channel].length; c<l;c++) // writing this message to all sockets with the same channel
						sockets[socket.channel][c].write("__JSON__START__" + json + "__JSON__END__");
                    time_to_exit = false;
                } else {  time_to_exit = true; } // if no json data found in buffer - then it is time to exit this loop
            } while ( !time_to_exit );
    }); // end of  socket.on 'data'

    socket.on('close', function(){  // we need to cut out closed socket from array of client socket connections
        if  (!socket.channel   ||   !sockets[socket.channel])  return;
        for (var i=0, l=sockets[socket.channel].length; i<l; i++) {
            if (sockets[socket.channel][i].connection_id == socket.connection_id) {
                sockets[socket.channel].splice(i, 1);
                break;
            }
        }
    }); // end of socket.on 'close'

}); //  end of server.on 'connection'

server.listen(cfg.port);
console.log('NoobHub on ' + server.address().address +':'+ server.address().port);