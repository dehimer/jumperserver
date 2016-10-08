var dgram = require('dgram'); 
var server = dgram.createSocket({type:'udp4', reuseAddr:true}); 


module.exports = function(params) {
	
	var PORT = params.port;
	var BROADCAST_ADDR = params.bip;
	var delay = params.delay;

	function broadcastNew(message) {
	    var message = new Buffer(message);
	    if(BROADCAST_ADDR){
		    server.send(message, 0, message.length, PORT, BROADCAST_ADDR, function() {
		        console.log("Sent '" + message + "' to "+BROADCAST_ADDR+':'+PORT);
		    });
	    }
	}

	server.bind({
		port: params.port,
		// broadcast: true,
	}, function() {
	    server.setBroadcast(true);
	    setInterval(function(){
	    	broadcastNew(params.message);
	    }, delay);
	});

	return {
		setBroadcastIP:function(bip){
			BROADCAST_ADDR = bip;
		}
	}
}