var dgram = require('dgram'); 
var server = dgram.createSocket("udp4"); 


module.exports = function(bip, delay, message) {
	
	var PORT = 5567;
	var BROADCAST_ADDR = bip;

	function broadcastNew(message) {
	    var message = new Buffer(message);
	    if(BROADCAST_ADDR){
		    server.send(message, 0, message.length, PORT, BROADCAST_ADDR, function() {
		        console.log("Sent '" + message + "' to "+BROADCAST_ADDR+':'+PORT);
		    });
	    }
	}

	server.bind(function() {
	    server.setBroadcast(true);
	    setInterval(function(){
	    	broadcastNew('hello');
	    }, delay);
	});

	return {
		setBroadcastIP:function(bip){
			BROADCAST_ADDR = bip;
		}
	}
}