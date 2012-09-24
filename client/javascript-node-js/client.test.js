/**
 * Created with JetBrains WebStorm.
 * User: sergii
 * Date: 9/21/12
 * Time: 6:11 PM
 * To change this template use File | Settings | File Templates.
 */

var noobhub = require('./client.js').noobhub;

//console.log(noobhub);

noobhub.subscribe(
    {
        server: 'localhost',
        port: 1337,
        channel: 'gsom'
    }
    , function(s){
        console.log('Subscribed!!!!')
    }
    , function(data) {
        console.log("get data: " + data);
    }
);