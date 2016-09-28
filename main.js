'use strict';

//sugar libs
var _ = require('underscore');
 
//electron libs
var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipc = electron.ipcMain;

//self written libs
var configuration = require('./libs/configuration');
var UdpServer = require('./libs/udpserver');
var colorgenerator = require('./libs/colorgenerator');


var mainWindow = null;
var settingsWindow = null;

var params = configuration.readSettings('params') || {offlinetimeout:3000,triggerlevel:3};
var clients = configuration.readSettings('clients') || {};
//reset clients
_.each(clients, function(client, id){
	delete clients[id].online;
	delete clients[id].color;
	delete clients[id].manualtrigger
});


const mainWindowSizes = [500, 600];

app.on('ready', function() {
    console.log('ready');
    console.log(clients);

    mainWindow = new BrowserWindow({
        frame: false,
        height: mainWindowSizes[0],
        width: mainWindowSizes[1]
        // resizable: false,
    });

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    mainWindow.on('closed', function () {
    	mainWindow = null;
        if (settingsWindow) {
	        settingsWindow.close();
        	settingsWindow = null;
	    }
    });
    
});

ipc.on('main-window:close', function () {
    app.quit();
});

ipc.on('settings-window:open', function () {

    if (settingsWindow) {
        return;
    }

    settingsWindow = new BrowserWindow({
        frame: false,
        height: 280,
        width: 230,
        resizable: false,
    });

    settingsWindow.loadURL('file://' + __dirname + '/app/settings.html');

    settingsWindow.on('closed', function () {
        settingsWindow = null;
    });

});

ipc.on('settings-window:close', function () {
    if (settingsWindow) {
        settingsWindow.close();
    }
});


ipc.on('settings-window:ready', function () {
	settingsWindow.webContents.send('settings-window:params', params);
});

ipc.on('settings-window:params', function (event, newParams) {
	params = newParams;
	configuration.saveSettings('params', params);
	mainWindow.webContents.send('main-window:params', params);
});


ipc.on('reset-clients', function () {
	clients = {};
    configuration.saveSettings('clients', clients);
    mainWindow.webContents.send('main-window:clients', clients);
});

ipc.on('main-window:new-client-state', function (event, state) {
	if(state.pos){
		console.log(state.id);
		clients[state.id].pos = state.pos;
		configuration.saveSettings('clients', clients);
	}
	if(typeof state.manualtrigger !== 'undefined'){
		clients[state.id].manualtrigger = state.manualtrigger;
	}
});



ipc.on('main-window:ready', function (event, args) {
	onMainWindowRendered();
})

function onMainWindowRendered () {

	if(!mainWindow){
		return;
	}
	
	// mainWindow.webContents.send('main-window:params', params);
    mainWindow.webContents.send('main-window:clients', clients);
}

console.log(UdpServer);
var offlineTimeouts = {};
var udpserver = UdpServer({
	host:'127.0.0.1',
	port:3000,
	onmessage: function(args){
		
		var ip = args.ip;
		var id = args.id;
		var val = args.val;


		var trigger = val > params.triggerlevel;
		var currDate = +(new Date());

		var clientExist = !!clients[id];

		//create
		if(!clientExist){
			clients[id] = {
				id:id
			};
		}

		//update state
		clients[id].trigger = trigger || clients[id].manualtrigger;
		clients[id].val = val;
		clients[id].ip = ip;
		clients[id].lastdgram = currDate;
		clients[id].online = true;


		//save and notice window
		if(!clientExist){
			configuration.saveSettings('clients', clients);
			mainWindow.webContents.send('main-window:clients', clients);
		}

		//send new state
		mainWindow && mainWindow.webContents.send('main-window:update-clients', clients[id]);


		//check offline
		if(!offlineTimeouts[id]){
			offlineTimeouts[id] = {};
		}
	    clearTimeout(offlineTimeouts[id]);
	    offlineTimeouts[id] = setTimeout(function(){
	        if(clients[id]){
	        	clients[id].online = false;
	        	delete clients[id].color;
	        }
	        mainWindow && mainWindow.webContents.send('main-window:update-clients', clients[id]);
	    }, params.offlinetimeout);
	}
})


colorgenerator.start(60, sendColor);

var e131clients = {};
function sendColor(color, clientId){

	var targetClients = _.filter(clients, function(client){
		return client.online && ((typeof clientId === 'undefined') || client.id === clientId);
	});

	color = [color.r, color.g, color.b];

	//indicate color
	_.each(targetClients, function(client){
		var colorToSend = client.trigger?[255,255,255]:color; 
		clients[client.id].color = colorToSend;
		// console.log(color);
		mainWindow && mainWindow.webContents.send('main-window:update-clients', clients[client.id]);
	
		if(!e131clients[client.id]){
			e131clients[client.id] = createClientChannel(client.ip, client.id);
		}

		e131clients[client.id](clients[client.id].color)
	});
}



function createClientChannel (ip, id) {

 	var e131 = require('e131');
	var client = new e131.Client(ip);  // or use a universe

 	var universe_big = (createUniverseClient)(120, client, 1);
 	var universe_small = (createUniverseClient)(60, client, 2);

 	return function(rgbcolor){
 		universe_big(rgbcolor);
 		universe_small(rgbcolor);
 	}
}

function createUniverseClient (size, client, universeId) {

	console.log('createUniverseClient: '+universeId);
	 
	var packet = client.createPacket(size*3);
	var channelData = packet.getChannelData();
	packet.setSourceName('E1.31 client '+universeId);
	packet.setUniverse(universeId);
	// console.log('set:'+universeId);

	return function fillAndSend (rgbcolor) {
		console.log(universeId+'<'+rgbcolor);
		for (var idx=0; idx<size; idx++) {
			_.each(rgbcolor, function(color, colorindex){
				channelData[idx*3+colorindex] = rgbcolor[colorindex];
			});
		}
		// console.log('get:'+packet.getUniverse());
		client.send(packet, function () {
			console.log('success sent to '+universeId);
		});
	} 
}