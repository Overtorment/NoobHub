
var async = require('async'),
    Noobhub = require('./client.js').Nbhb,
    config  = {
        zerlings: 1000
    };

var _onSubscribed = function(idx) {
    console.log(idx + ' subscribed');
}

var _onMessage = function(idx ,data) {
    console.log(idx + ' received: ' + data);
}

var _onError = function(idx ,err) {
    console.log(idx + ' is dead: ' + err);
}

var z = function(idx) {
    var n = new Noobhub();
    n.subscribe({
        port: 1337,
        server: 'localhost',
        channel: idx % 7
    }, function() { return _onSubscribed(idx); }
    , function(msg) { return _onMessage(idx, msg); }
    , function(err) { return _onError(idx, err); }
    );
    
    // let's add some chat
    setInterval(function(){
        process.nextTick(function(){
            n.publish( "[zerg_"+ idx + "] > my random is " + Math.random());
        });
    }, 1000 * (idx % 7));
};

console.log('spawning swarm in a second');


for (var i=0, l=config.zerlings; i<l; i++) {
    (function(idx){
        return z(idx);
    }(i))
}