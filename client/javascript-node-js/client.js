/**
 * NoobHub Client Library
 *
 */

var net = require("net")
    , configDef = {
        server: 'localhost',
        port: 1337,
        channel: 'gsom'
    };

var Nbhb = exports.Nbhb = function() {

    var self = this;

	this.socket = null;
    this.messageCallback = null
	this.errorCallback = null;

    this.config = configDef;

    self.subscribe = function(config, subscribedCallback, receivedMessageCallback, errorCallback) {
        for (var prop in config) {
            if (self.config.hasOwnProperty(prop))
                self.config[prop] = config[prop];
        }
        self.messageCallback = receivedMessageCallback;
        self.errorCallback = errorCallback;
        self.socket = new net.createConnection(self.config.port, self.config.server);
        self.socket.setNoDelay(true);
        self.socket._isConnected = false;

        self.socket.on('connect', function(){
            console.log('connected to ', config.server + ':' + config.port);
            self.socket.write("__SUBSCRIBE__" + config.channel + "__ENDSUBSCRIBE__", function(){
                self.socket._isConnected = true;

                if (typeof(subscribedCallback) === "function") {
                    subscribedCallback(self.socket);
                }

                if (typeof(receivedMessageCallback) === "function") {
                    self.messageCallback = receivedMessageCallback;
                    self.socket.on('data', self._handleIncomingMessage);
                }
            });

        });

		self.socket.on('error', function(err){
			console.log("err0r:::", err);

			if (typeof(self.errorCallback) === "function") {
			    return self.errorCallback(err);
			} else return;
		});

    } //  end of self.subscribe()

    self.publish = function(message, cb) {
        if (!self.socket._isConnected)
            return false;

        if (typeof message !== "string")
            message = JSON.stringify(message);

        this.socket.write("__JSON__START__" +message+ "__JSON__END__", cb);
    }

    self.unsubscribe = function() {
        if (self.socket._isConnected) {
			self.socket.end("Take care NoobHub...");
			self.socket._isConnected = false;
		}
    }

    self._handleIncomingMessage = function(data) {
        var str = String(data).replace(/__JSON__START__|__JSON__END__|\r|\n/g, '');
	    var s = String(str).replace(/}{|\r|\n/g, '}<splitHere>{');

        if (s == str){

            if (typeof(self.messageCallback) === "function")
                self.messageCallback(str);
        }
        else{
	    str = s.split("<splitHere>");
	    for (var i in str) {
	      if (typeof(self.messageCallback) === "function")
		self.messageCallback(str[i]);
	    }
	}
    }

};

exports.noobhub = new Nbhb();
