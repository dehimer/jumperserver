var ip = require('ip');

var os = require('os');
var ifaces = os.networkInterfaces();

var foundedifaces = {}

Object.keys(ifaces).forEach(function (ifname) {
	var alias = 0;

	ifaces[ifname].forEach(function (iface) {
		if ('IPv4' !== iface.family || iface.internal !== false) {
			// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			return;
		}

		iface.broadcast = ip.subnet(iface.address, iface.netmask).broadcastAddress;

		if (alias >= 1) {
			// this single interface has multiple ipv4 addresses
			console.log(ifname + ':' + alias, iface.address);
			foundedifaces[ifname + ':' + alias] = iface;
		} else {
			// this interface has only one ipv4 adress
			console.log(ifname, iface.address);
			foundedifaces[ifname] = iface;
		}
		++alias;
	});
});

module.exports.get = function(iface){
	return iface?foundedifaces[iface]:foundedifaces;
}