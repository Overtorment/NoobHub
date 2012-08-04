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
			//console.log(dump(data_raw));
            for (var c=0, l=data_raw.length; c< l; c++)
                /*if (data_raw[c]  != 10 && data_raw[c]  != 13) */  socket.buffer +=  String.fromCharCode(data_raw[c] );
            
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
            
            var time_to_exit = true;
do{
            if (  ( (  start = socket.buffer.indexOf("__JSON__START__"))   !=  -1)     &&    ((  end = socket.buffer.indexOf("__JSON__END__") )  !=  -1   )   ) {
                var json = socket.buffer.substr(   start+15, (   end-(start+15)  )  );
                console.log("json =  " + json);
				socket.buffer =    socket.buffer.substr(0,start) + socket.buffer.substr(end + 13);  // cut
                 for (var c =0, l=sockets[socket.channel].length; c<l;c++) // writing this message to all sockets with the same channel
                         sockets[socket.channel][c].write("__JSON__START__" + json + "__JSON__END__" /*+ '\r\n'*/);
				time_to_exit = false;
            } else { time_to_exit=true; }
} while (   !time_to_exit    )

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


















function dump(arr,level) {
	var dumped_text = "";
	if(!level) level = 0;
	
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";
	
	if(typeof(arr) == 'object') { //Array/Hashes/Objects 
		for(var item in arr) {
			var value = arr[item];
			
			if(typeof(value) == 'object') { //If it is an array,
				dumped_text += level_padding + "'" + item + "' ...\n";
				dumped_text += dump(value,level+1);
			} else {
				dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		}
	} else { //Stings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}