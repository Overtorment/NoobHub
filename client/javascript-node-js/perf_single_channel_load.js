/*
    npm install async node-statsd
*/

var dgram   = require('dgram'),
    Noobhub = require('./client.js').Nbhb,
    config  = {
        zerglings: 1024,
        channel: 'gsom',
        statsd: {
            port: 8125,
            host: '46.4.76.236',
            prefix: 'noobhub.testload.'
        }
    };

var zergsAlive = config.zerglings;

var _sendMetrics = function(msg) {
   return false;


 var cfg = config.statsd;
    var message = new Buffer(cfg.prefix + msg);
    var client = dgram.createSocket("udp4");
    client.send(message, 0, message.length, cfg.port, cfg.host, function(err) {
        if (err) {
            console.error(err);
        }
        client.close();
    });
}

var _onSubscribed = function(idx) {
    //console.log(idx + ' subscribed');
}

var _onMessage = function(idx ,data) {
    console.log(idx + ' received: ' + data);
}

var _onError = function(idx ,err) {
  zergsAlive--;
  console.log(idx + ' is DEAD: ' + err);
}

setTimeout(function(){
  console.log('ZERGS ALIVE: ', zergsAlive);
}, 60*1000);

var z = function(idx) {
    var talkInterval = 1 //Math.round(Math.random()*10) + 1 // say smthng randomly once per 0 ..10 seconds
        , channel = config.channel //idx % config.numberOfChannels
        , n = new Noobhub()
        , startTime = null
        , _myMessage = null
        , isAlive = 0
        , _interval = null
        , _changeChannel = null
        , _subscribe = function() {
            n.subscribe({
                port: 1337,
                server: 'localhost',
                channel: channel
            }, function() { isAlive = 1; return _onSubscribed(idx); }
            , function(msg) {
                if (msg === _myMessage) {
                    var lat = Date.now() - startTime;
                    console.log(idx + 'latency is : ',  lat);
                    //_sendMetrics('latency:'+lat+'|ms');
                }
                return _onMessage(idx, msg);
            }
            , function(err) {
                isAlive = 0;
                clearInterval(_interval);
                clearInterval(_changeChannel);
                return _onError(idx, err);
            }
            );
        }
        , _publishOrDie = function(){
            if (isAlive) {
                process.nextTick(function(){
                    _myMessage = "[zerg_"+ idx + "] > my random is " + Math.random();
                    startTime = Date.now();
                    n.publish( _myMessage );
                });
            } else {
                clearInterval(_interval);
                clearInterval(_changeChannel);
                n.unsubscribe();
                n = null;
            }
        };

    // connect
    _subscribe();

    // let's add some chat
    _interval = setInterval(_publishOrDie, 1000 * talkInterval);
};

console.log(' -- spawning swarm in a second -- :  ', zergsAlive);


for (var i=0, l=config.zerglings; i<l; i++) {
    (function(idx){
        process.nextTick(function() { return z(idx);  }); //return z(idx);
    }(i));
}
