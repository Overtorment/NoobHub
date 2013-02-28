/**
 * NoobHub client usage example
 * 30/09/2012
 */

var noobhub = require('./client.js').noobhub;

noobhub.subscribe(
    {
        server: process.env.host, // adapted to cloud9
        port: 21755,
        channel: 'gsom'
    }
    , function(s){
        console.log('subscribed callback');
		
        var tries = 0, maxTries = 10000;
        
        setTimeout(function() {
            
            noobhub.publish({ a : Math.random() }, function(){
    		    console.log("data sent");
		    });
            
            if (tries++ < maxTries) 
                setTimeout(arguments.callee, 50);
            
        }, 50);
		
		
    }
    , function(data) {
        console.log("get data callback: " + data);
    },
	function(err) {
		console.log("error callback : " + err)
	}
);
