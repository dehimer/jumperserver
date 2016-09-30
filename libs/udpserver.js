var dgram = require('dgram');
var server = dgram.createSocket('udp4');

console.log('udpserver');
module.exports = function (args) {
	console.log(args);

	/* UDP part*/
	var PORT = args.port;
	var HOST = args.host;

	if(!PORT || !HOST){
		return;
	}

	server.on('listening', function () {
	    var address = server.address();
	    console.log('UDP Server listening on ' + address.address + ":" + address.port);
	});


	server.on('message', function (data, remote) {

		var ip = remote.address;
		
		var data = (data+'').split(' ');
		var id = data[0];
		var val = data[1]*1;

		if(args && args.onmessage){
			args.onmessage({ip:ip, id:id, val:val});
		} 

	});

	server.bind(PORT, HOST);
}