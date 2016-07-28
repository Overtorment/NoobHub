/**
 * NoobHub client usage example
 * 30/09/2012
 */

var noobhub = require('./client.js').noobhub;

noobhub.subscribe(
    {
        server: 'localhost',
        port: 1337,
        channel: 'gsom'
    }
    , function(s){
        console.log('subscribed callback');
		noobhub.publish({ a : Math.random() }, function(){
			console.log("data sent");
		});
    }
    , function(data) {
        console.log("get data callback: " + data);
    },
	function(err) {
		console.log("error callback : " + err)
	}
);
