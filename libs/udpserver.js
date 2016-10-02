var dgram = require('dgram');

function runServer(port, ip, handler){

	var server = dgram.createSocket('udp4');
	var runned = false;
	server.on('listening', function () {
	    var address = server.address();
	    console.log('UDP Server listening on ' + address.address + ":" + address.port);
	});


	server.on('message', function (data, remote) {

		var ip = remote.address;
		
		var data = (data+'').split(' ');
		var id = data[0];
		var val = data[1]*1;

		if(handler){
			handler({ip:ip, id:id, val:val});
		} 

	});

	server.bind(port, ip);

	return {
		stop: function(){
			try{
				server.close(function(){
					delete server;
				});
			}catch(e){
				console.log(e);
			}
		}
	}
}

console.log('udpserver');
var lastServer;
module.exports = function (args) {
	
	console.log(args);

	/* UDP part*/
	var PORT = args.port;
	var HOST = args.host;
	var HANDLER = args.onmessage;

	if(PORT && HOST){
		lastServer = runServer(PORT, HOST, HANDLER);
	}

	return {
		setIP: function(ip) {
			if(lastServer){
				lastServer.stop();
			}
			console.log('new ip '+ip);
			if(ip && ip !== HOST){
				lastServer = runServer(PORT, HOST, HANDLER);
			}
			HOST = ip;
		}
	}
}