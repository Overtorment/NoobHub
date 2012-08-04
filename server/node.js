var net = require('net');
var crypto = require('crypto');
var server = net.createServer();

var sockets = {};

server.listen(1337);

console.log('Server listening on ' + server.address().address +':'+ server.address().port);

server.on('connection', function(socket) { 
    var hash = crypto.createHash('sha1');
    hash.update(  ('nubhub'  + Date.now() + Math.random() )  );
    socket.connection_id = hash.digest('hex');
    socket.channel = '';
	socket.buffer = ''; 

    console.log('CONNECTION: ' + socket.remoteAddress +':'+ socket.remotePort);

    socket.on('data', function(data_raw) {
            for (var c=0, l=data_raw.length; c< l; c++)
                if (data_raw[c]  != 10 && data_raw[c]  != 13)   socket.buffer +=  String.fromCharCode(data_raw[c] );
            
            var start, end;
            
            if (  ( (  start = socket.buffer.indexOf("__SUBSCRIBE__"))   !=  -1)     &&   ((  end = socket.buffer.indexOf("__ENDSUBSCRIBE__") )  !=  -1   )   ) {
                socket.channel= socket.buffer.substr(   start+13, (   end-(start+13)  )  );
				socket.write('hi there\r\n');
                console.log("channel = "+socket.channel);
                socket.buffer =    socket.buffer.substr(0,start) + socket.buffer.substr(end + 16);  // cut
				console.log ('left =  ' + socket.buffer);
                sockets[socket.channel] = sockets[socket.channel] || []; // array of sockets  subscribed to the same channel
                sockets[socket.channel].push(socket);
            }
            
            
            if (  ( (  start = socket.buffer.indexOf("__JSON__START__"))   !=  -1)     &&    ((  end = socket.buffer.indexOf("__JSON__END__") )  !=  -1   )   ) {
                var json = socket.buffer.substr(   start+15, (   end-(start+15)  )  );
                console.log("json =  " + json);
				socket.buffer =    socket.buffer.substr(0,start) + socket.buffer.substr(end + 13);  // cut
                 for (var c =0, l=sockets[socket.channel].length; c<l;c++) // writing this message to all sockets with the same channel
                         sockets[socket.channel][c].write("__JSON__START__" + json + "__JSON__END__" + '\r\n');
            }

    }); // end of  socket.on 'data'

	
    socket.on('close', function(){
		if   ( !socket.channel   ||   !sockets[socket.channel])  return;
        for (var i=0, l=sockets[socket.channel].length; i<l; i++) {
            if (sockets[socket.channel][i].connection_id == socket.connection_id) {
                sockets[socket.channel].splice(i, 1);
                break;
            }
        }
    }); // end of socket.on 'close'

}); //  end of server.on 'connection'
