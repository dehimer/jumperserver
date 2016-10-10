var e131 = require('e131');

var _ = require('underscore');
// var EventEmitter = require('events');


var DEFAULT_PORT = 5568;
var DEFAULT_TRIGGERLEVEL = 512;
var UNIVERSES_SIZE = {
	inner: 60,
	outer: 120
};


var settings = require('./settings');
var clients = settings.read('clients') || {};

//reset clients
_.each(clients, function(client, id){
	delete clients[id].online;
	delete clients[id].outerColors;
	delete clients[id].innerColors;
	delete clients[id].manualtrigger
});


var helpers = {
	fillByColor: function (size, rgbcolor) {
		var colors = [];
		for (var i=0; i<size; i++) {
			_.each(rgbcolor, function(color, colorindex){
				colors[i*3+colorindex] = rgbcolor[colorindex];
			});
		}
		return colors;
	},
	createClientChannels: function (client, port, sizes) {

		var ip = client.ip;
		var id = client.id;

	 	var e131 = require('e131');
		var e131Client = new e131.Client(ip, port);  // or use an universe

	 	var universe_outer = (helpers.createUniverseClient)(sizes.outer, e131Client, 1);
	 	var universe_inner = (helpers.createUniverseClient)(sizes.inner, e131Client, 2);

	 	return function(){
	 		console.log('send');
	 		universe_outer(client.outerColors);
	 		universe_inner(client.innerColors);
	 	}
	},
	createUniverseClient: function (size, e131Client, universeId) {

		// console.log('createUniverseClient: '+universeId);
		 
		var packet = e131Client.createPacket(size*3);
		var channelData = packet.getChannelData();
		packet.setSourceName('E1.31 e131Client '+universeId);
		packet.setUniverse(universeId);
		// console.log('set:'+universeId);

		return function fillAndSend (colors) {
			if(!colors){
				return;
			}
			// console.log(universeId+'<'+rgbcolor);
			for (var i=0; i<size*3; i++) {
				// _.each(rgbcolor, function(color, colorindex){
				// 	channelData[idx*3+colorindex] = rgbcolor[colorindex];
				// });
				channelData[i] = colors[i];

			}
			// console.log(size);
			// console.log(channelData);
			// console.log('get:'+packet.getUniverse());
			e131Client.send(packet, function () {
				// console.log('success sent to '+universeId);
			});
		} 
	}
}

module.exports = function(params){

	// if(params)

	var PORT = (params && params.port) || DEFAULT_PORT;
	

	return function(id) {

		// console.log('id: '+id);

		if(typeof id === 'undefined'){
			return {
				get: function(){
					return clients;
				},
				reset: function(){
					clients = {};
					settings.save('clients', clients);
				}
			}
		} else {

			var newclient = false;


			var client = clients[id];
			if(!client){
				newclient = true;
				// console.log('add '+id);
				clients[id] = {
					id: id,
					triggerlevel: DEFAULT_TRIGGERLEVEL
				};
				settings.save('clients', clients);

				client = clients[id];
			}

			var api = {
				set: function(state){
					// console.log(state);

					_.extend(client, state);

					client.trigger = (client.val > client.triggerlevel) || client.manualtrigger;

					// console.log(client);
					settings.save('clients', clients);
					
					// clients[id] = client;
					
					return client;
				},
				get: function(){
					return client;
				},
				update: function(state){
					if(state.pos){
						// console.log(state.id);
						clients[state.id].pos = state.pos;
						settings.save('clients', clients);
					}
					if(typeof state.manualtrigger !== 'undefined'){
						clients[state.id].manualtrigger = state.manualtrigger;
					}
				},
				// обработка нового состояния клиента
				handleMessage: function(data, cb) {
					// console.log('handle');
					this.set({
						val: data.val,
						ip: data.ip,
						lastdgram: +(new Date()),
						online: true
					});

					cb && cb(null, {newclient: newclient})
				},
				// задать всем диодам один цвет
				setInnerColor: function(color){
					client.innerColors = helpers.fillByColor(UNIVERSES_SIZE['inner'], color);
				},
				// задать всем диодам один цвет
				setOuterColor: function(color){
					client.outerColors = helpers.fillByColor(UNIVERSES_SIZE['outer'], color);
				},
				// массив цветов, чтобы задавать более сложные сочетания цветов (может лучше через метод, смотри сам)
				setInnerColors: function(colors){
					client.innerColors = _.flatten(colors);
				},
				// массив цветов (то же самое)
				setOuterColors: function(colors){
					client.outerColors = _.flatten(colors);
				},
				// отправляет значения цветов массивов в сеть
				updateLeds: function(){

					if(!client.send){
						client.send = helpers.createClientChannels(client, PORT, UNIVERSES_SIZE);
					}

					client.send();
				},
				// последние значение датчика
				getLastVal: function(){
					return client.val;
				},
				getID: function(){
					return id;
				}
			};

			return api;

		}

	}
}