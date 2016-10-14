var _ = require('underscore');

//получение события активации/деактивации круга
//в ответ подсвечивание круга белым цветом

module.exports = function (args){
	
	var can = args.can;
	var clients = args.clients;

	var activeGroup = {}; //id->color

	//отслеживание изменений клиентов
	can.on('client:changed', function(client){
		console.log('client '+client.id+' trigger:'+client.trigger);
	});

	//установка режима работы генератора цвета
	can.emit('color:change_regim', 'hue');

	//получение нового общего цвета от генератора цвета
	can.on('color:new', function(color) {
		// console.log('color:new '+color)
		var targetClients = _.filter(clients().get(), function(client){
			return client.online && ((typeof clientId === 'undefined') || client.id === clientId);
		});

		color = [color.r, color.g, color.b];

		// console.log(targetClients);
		//indicate color
		_.each(targetClients, function(client){
			// console.log(client);
			var id = client.id;
			var colorToSend = activeGroup[id]?activeGroup[id]:color;
			colorToSend = client.trigger?[255,255,255]:colorToSend; 
			// console.log(colorToSend);


			clients(id).setOuterColor(_.clone(colorToSend));
			clients(id).setInnerColor(_.clone(colorToSend).reverse());
			clients(id).updateLeds();
		});
	});


	//демо подсветки случайных кругов одним цветом
	setInterval(function(){

		var color = [0, 255, 0];

		activeGroup = _.reduce(_.keys(clients().get()), function(resActiveGroup, clientId){
			if(Math.random()>0.8){
				resActiveGroup[clientId] = _.clone(color);
			}
			return resActiveGroup
		}, {});
		console.log(activeGroup);

	}, 2000);

}