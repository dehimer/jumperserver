var e131 = require('e131');

var _ = require('underscore');
var EventEmitter = require('events');

/*
var methods = {
	add: function(id){
		clients[id] = {
			id:id,
			triggerlevel: 512
		};
		settings.save('clients', clients);
	},
	set: function(id, state){

		var needsendcolor = (state.color && state.color !== clients[id].color);

		_.extend(clients[id], state);

		clients[id].trigger = (clients[id].val > clients[id].triggerlevel) || clients[id].manualtrigger;

		settings.save('clients', clients);

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
		settings.save('clients', clients);
	},
	update: function(state){
		if(state.pos){
			console.log(state.id);
			clients[state.id].pos = state.pos;
			settings.save('clients', clients);
		}
		if(typeof state.manualtrigger !== 'undefined'){
			clients[state.id].manualtrigger = state.manualtrigger;
		}
	},
	setup: function(options){
		if(options && options.port){
			PORT = options.port;
		}
	},

	fill: (size, color) {
		// console.log(universeId+'<'+rgbcolor);
		for (var idx=0; idx<size; idx++) {
			_.each(rgbcolor, function(color, colorindex){
				channelData[idx*3+colorindex] = rgbcolor[colorindex];
			});
		}
	}
}


var clients = {};
var e131clients = {};


module.exports = function(id) {

	var client = clients[id];

	if(!client){
		methods.add(id);
	}

	return {
		setInnerColor: function(color){ //; задать всем диодам один цвет
			//взять клиента, его массив
			client.inner = 
		},
		setOuterColor: function(){ //задать всем диодам один цвет
		},
		setInnerColors: function(){// - массив цветов, чтобы задавать более сложные сочетания цветов (может лучше через метод, смотри сам)
		},
		setOuterColors: function(){// - массив цветов (то же самое)
		},
		updateLeds: function(){// - отправляет значения цветов массивов в сеть
		},
		getLastVal: function(){// - последние значение датчика …
		}
		getID: function(){
		}
	}
}
*/


var helpers = {
	fillByColor: function (size, rgbcolor) {
		for (var i=0; i<size; i++) {
			_.each(rgbcolor, function(color, colorindex){
				channelData[i*3+colorindex] = rgbcolor[colorindex];
			});
		}
	},
	createClientChannels: function (client, port, sizes) {

		var ip = client.ip;
		var id = client.id;

	 	var e131 = require('e131');
		var e131Client = new e131.Client(ip, port);  // or use an universe

	 	var universe_outer = (helpers.createUniverseClient)(sizes.outer, e131Client, 1);
	 	var universe_inner = (helpers.createUniverseClient)(sizes.inner, e131Client, 2);

	 	return function(){
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
			// console.log(universeId+'<'+rgbcolor);
			for (var idx=0; idx<size*3; idx++) {
				// _.each(rgbcolor, function(color, colorindex){
				// 	channelData[idx*3+colorindex] = rgbcolor[colorindex];
				// });
				channelData[idx] = colors[idx];

			}
			// console.log('get:'+packet.getUniverse());
			e131Client.send(packet, function () {
				// console.log('success sent to '+universeId);
			});
		} 
	},
}

module.exports = function(params){

	var DEFAULT_PORT = 5568;
	var UNVERSES_SIZE = {
		inner: 60,
		outer: 120
	};


	var settings = require('./settings');
	var clientsSettings = settings.read('clients') || {};
	var clients = {};


	var PORT = (options && options.port) || DEFAULT_PORT;
	
	return function(id) {

		var client = clients[id];

		if(!client){
			client = {id: id};
			clients[id] = client;
		}

		_.extend(client.api, new EventEmitter());

		client.api = {
			// обработка нового состояния клиента
			handleMessage: function(data) {

			},
			// задать всем диодам один цвет
			setInnerColor: function(color){
				client.innerColors = helpers.fillByColor(UNVERSES_SIZE['inner'], color);
			},
			// задать всем диодам один цвет
			setOuterColor: function(){
				client.outerColors = helpers.fillByColor(UNVERSES_SIZE['outer'], color);
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

				if(!client.connector){
					// client.connector = helpers.createConnector();
					// var e131Client = new e131.Client(client.ip, PORT);
					client.send = helpers.createClientChannels(client, PORT, UNVERSES_SIZE);
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


		return client.api;
	}
}