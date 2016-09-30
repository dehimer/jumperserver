var _ = require('underscore');

var configuration = require('./configuration');
var clients = configuration.readSettings('clients') || {};

//reset clients
_.each(clients, function(client, id){
	delete clients[id].online;
	delete clients[id].color;
	delete clients[id].manualtrigger
});

var e131clients = {};


module.exports = {
	add: function(id, state){
		clients[id] = state;
		configuration.saveSettings('clients', clients);
	},
	set: function(id, state){

		var needsendcolor = (state.color && state.color !== clients[id].color);

		_.extend(clients[id], state);
		configuration.saveSettings('clients', clients);

		if(!e131clients[id]){
			e131clients[id] = createClientChannel(clients[id]);
		}

		needsendcolor && e131clients[id](state.color)

	},
	get: function(id){
		if(id){
			return clients[id];
		}else{
			return clients;
		}
	},
	reset: function(){
		clients = {};
		configuration.saveSettings('clients', clients);
	},
	update: function(state){
		if(state.pos){
			console.log(state.id);
			clients[state.id].pos = state.pos;
			configuration.saveSettings('clients', clients);
		}
		if(typeof state.manualtrigger !== 'undefined'){
			clients[state.id].manualtrigger = state.manualtrigger;
		}
	}

}


function createClientChannel (client) {

	var ip = client.ip;
	var id = client.id;

 	var e131 = require('e131');
	var client = new e131.Client(ip, 5568);  // or use a universe

 	var universe_big = (createUniverseClient)(120, client, 1);
 	var universe_small = (createUniverseClient)(60, client, 2);

 	return function(rgbcolor){
 		// console.log(id);
 		universe_big(rgbcolor);
 		universe_small(rgbcolor);
 	}
}

function createUniverseClient (size, client, universeId) {

	// console.log('createUniverseClient: '+universeId);
	 
	var packet = client.createPacket(size*3);
	var channelData = packet.getChannelData();
	packet.setSourceName('E1.31 client '+universeId);
	packet.setUniverse(universeId);
	// console.log('set:'+universeId);

	return function fillAndSend (rgbcolor) {
		// console.log(universeId+'<'+rgbcolor);
		for (var idx=0; idx<size; idx++) {
			_.each(rgbcolor, function(color, colorindex){
				channelData[idx*3+colorindex] = rgbcolor[colorindex];
			});
		}
		// console.log('get:'+packet.getUniverse());
		client.send(packet, function () {
			// console.log('success sent to '+universeId);
		});
	} 
}