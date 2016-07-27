var echo  = (process.argv && process.argv[2] == 'echo')
, net = require('net')
, crypto = require('crypto')

, Trololo = new function() {

	var host  = 'localhost'
	  , port  = '1337'
	  , self = this
	  , channel = 'gsom'
	  , socket  = null
	  , hash = null
	  , md5 = crypto.createHash('md5')
	  , startTime = 0
	  , triesMax = 1000
	  , tryCurrent = 0
	  , stats = {
			max: 0,
			min: 10000,
			average: 0,
			data: []
	   };

	this.send = function() {
		console.log('[BENCHMARKING MODE]');
		self._connectAndSubscribe(function(){
			socket.on('data', self._measure);
			self._ping();
		});
	}

	this._ping = function() {
		hash = String( Math.random() * 1000 );
		console.log('sending hash ', hash);
		startTime = new Date().getTime();
		socket.write("__JSON__START__" + hash + "__JSON__END__");
	}

	this._measure = function(data) {
		console.log('got data ', String(data));

		var str = String(data).replace(/__JSON__START__|__JSON__END__|\r|\n/g, '');

		if (str == hash) {
			var lat = new Date().getTime() - startTime;
			console.log('latency ', lat);
			stats.data.push(lat);
			var summ = 0;
			if (++tryCurrent == triesMax) {

				for (var i=0, l=stats.data.length; i<l; i++) {

					if (stats.data[i] > stats.max) {
						stats.max = stats.data[i]
					}

					if (stats.data[i] < stats.min) {
						stats.min = stats.data[i]
					}
					summ += stats.data[i];
				}

				stats.average = Number(summ / triesMax).toFixed(2);

				console.log('[RESULTS]');
				console.log('max latency : ' + stats.max);
				console.log('min latency : ' + stats.min);
				console.log('average : ' + stats.average);

			} else {
				self._ping();
			}
		} else {
			//throw data + " != " + hash;
			//console.log(str + " != " + hash);
		}
	}

	this.listen = function() {
		console.log('[ECHO MODE]');
		self._connectAndSubscribe();

		var lastResponse = null;
		socket.on('data', function(data){

			if (String(data) != String(lastResponse)) {
				console.log('incoming data', data);
				lastResponse = data;
				socket.write("__JSON__START__" + data + "__JSON__END__");
			}
		})
	}

	this._connectAndSubscribe = function(cb) {
		socket = new net.createConnection(port, host);
		socket.setNoDelay(true);

		socket.on('connect', function(){
			console.log('connected to ', host, port);
			console.log(arguments);

			socket.write("__SUBSCRIBE__" + channel + "__ENDSUBSCRIBE__");

			if (typeof(cb) == "function") cb();
		})
	}
}

echo ? Trololo.listen() : Trololo.send();
