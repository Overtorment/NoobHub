/**
 * Created with JetBrains WebStorm.
 * User: sergii
 * Date: 9/21/12
 * Time: 5:41 PM
 * To change this template use File | Settings | File Templates.
 */

var net = require("net")
    , configDef = {
        server: 'localhost',
        port: 1337,
        channel: 'gsom'
    };

exports.noobhub = new function() {

    var self = this
        , socket = null
        , messageCallback = null;

    self.config = configDef;

    self.subscribe = function(config, subscribedCallback, receivedMessageCallback) {

        for (var prop in config) {

            if (self.config.hasOwnProperty(prop))
                self.config[prop] = config[prop];
        }

        var s = self.socket;

        s = new net.createConnection(self.config.port, self.config.server);
        s.setNoDelay(true);
        s._isConnected = false;

        s.on('connect', function(){
            console.log('connected to ', config.server, config.port);
            s.write("__SUBSCRIBE__" + config.channel + "__ENDSUBSCRIBE__", function(){
                s._isConnected = true;

                if (typeof(subscribedCallback) === "function") {
                    subscribedCallback(s);
                }

                if (typeof(receivedMessageCallback) === "function") {
                    self.messageCallback = receivedMessageCallback;
                    s.on('data', self._handleIncomingMessage);
                }
            });

        });


    }

    self.publish = function(message, cb) {

        if (!this.socket)
            return false;

        if (typeof message !== "string")
            message = JSON.stringify(message);

        this.socket.write("__JSON__START__" +message+ "__JSON__END__", cb);
    }

    self.unsubscribe = function() {

        if (this.socket)
            this.socket.end("Take care NoobHub...");

    }

    self._handleIncomingMessage = function(data) {

        var str = String(data).replace(/__JSON__START__|__JSON__END__|\r|\n/g, '');

        if (typeof(messageCallback) === "function")
            self.messageCallback(str);
    }

};