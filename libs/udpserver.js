var dgram = require('dgram');

function runServer(port, host, handler){

	var server = dgram.createSocket({type:'udp4', reuseAddr:true});
	var runned = false;
	server.on('listening', function () {
	    var address = server.address();
	    console.log('UDP Server listening on ' + address.address + ":" + address.port);
	});


	server.on('message', function (data, remote) {

		console.log('message');

		var ip = remote.address;

		console.log(host, ip);

		var data = (data+'').split(' ');
		var id = data[0];
		var val = data[1]*1;

		if(handler && !isNaN(id*1)){
			handler({ip:ip, id:id, val:val});
		} 

	});
	server.bind(port, host);

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