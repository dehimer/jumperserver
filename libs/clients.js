var _ = require('underscore');
var EventEmitter = require('events');

var settings = require('./settings');

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

var DEFAULT_PORT = 5568;
var UNVERSES_SIZE = {
	inner: 60,
	outer: 120
}

var clientsSettings = settings.read('clients') || {};
var clients = {};


var helpers = {
	fillByColor: function (size, rgbcolor) {
		for (var i=0; i<size; i++) {
			_.each(rgbcolor, function(color, colorindex){
				channelData[i*3+colorindex] = rgbcolor[colorindex];
			});
		}
	},
	createClientChannel: function (client) {

		var ip = client.ip;
		var id = client.id;

	 	var e131 = require('e131');
		var client = new e131.Client(ip, PORT);  // or use an universe

	 	var universe_big = (helpers.createUniverseClient)(120, client, 1);
	 	var universe_small = (helpers.createUniverseClient)(60, client, 2);

	 	return function(rgbcolor){
	 		// console.log(id);
	 		universe_big(rgbcolor);
	 		universe_small(rgbcolor);
	 	}
	}

	createUniverseClient: function (size, client, universeId) {

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
}

module.exports = function(id) {

	var client = clients[id];

	if(!client){
		client = {id: id};
		clients[id] = client;
	}

	// _.extend(client.api, new EventEmitter());

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
			if(!e131clients[id]){
				e131clients[id] = createClientChannel(clients[id]);
			}

			needsendcolor && e131clients[id].sendColors();
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