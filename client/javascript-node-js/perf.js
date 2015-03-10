/*
    npm install async node-statsd
*/

var async   = require('async'),
    statsd  = require('node-statsd'),
    client  = new statsd(),
    Noobhub = require('./client.js').Nbhb,
    config  = {
        zerlings: 1000,
        numberOfChannels: 20
    };

var _onSubscribed = function(idx) {
    console.log(idx + ' subscribed');
}

var _onMessage = function(idx ,data) {
    //console.log(idx + ' received: ' + data);
}

var _onError = function(idx ,err) {
    console.log(idx + ' is DEAD: ' + err);
}

var z = function(idx) {
    var talkInterval = Math.round(Math.random()*10) + 1 // say smthng randomly once per 0 ..10 seconds
        , channel = idx % config.numberOfChannels
        , n = new Noobhub()
        , isAlive = 0
        , _interval = null
        , _changeChannel = null
        , _subscribe = function() {
            n.subscribe({
                port: 1337,
                server: 'localhost',
                channel: channel
            }, function() { isAlive = 1; return _onSubscribed(idx); }
            , function(msg) { return _onMessage(idx, msg); }
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
                    n.publish( "[zerg_"+ idx + "] > my random is " + Math.random());
                });
            } else {
                clearInterval(_interval);
                clearInterval(_changeChannel);
                n.unsubscribe();
                n = null;
            }
        }
        , _changeChannelOrDie = function() {
            var _idx = idx < 1000000000 ? idx++ : 0;
            if (isAlive) {
                channel = ( _idx % config.numberOfChannels );
                process.nextTick(function(){
                    _subscribe();
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

    // let's change the channel once in a while
    _changeChannel = setInterval(_changeChannelOrDie, 1000 * 10 * talkInterval);
};

console.log(' -- spawning swarm in a second -- ');


for (var i=0, l=config.zerlings; i<l; i++) {
    (function(idx){
        return z(idx);
    }(i))
}