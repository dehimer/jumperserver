'use strict';

var _ = require('underscore');
 
var configuration = require('./configuration');
var electron = require('electron')
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipc = electron.ipcMain;

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


const mainWindowSizes = [500,600];

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


/* UDP part*/
var PORT = 3000;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});


var offlineTimeouts = {};
server.on('message', function (data, remote) {

	var ip = remote.address;
	
	var data = (data+'').split(' ');
	var id = data[0];
	var val = data[1]*1;

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
        clients[id].online = false;
        mainWindow && mainWindow.webContents.send('main-window:update-clients', clients[id]);
    }, params.offlinetimeout);

});

server.bind(PORT, HOST);


var hue = 0;
var currentColor = genColor(hue);
setInterval(function(){
	// console.log(hue);
	hue = (hue+10)%360;
	currentColor = genColor(hue);
	sendColor(currentColor);
}, 100);


function genColor(h){
	return HSVtoRGB(h/360, 1, 1);
}

/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

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

 	var universe_big = (createUniverseClient)(120, ip, id*2-1);
 	var universe_small = (createUniverseClient)(60, ip, id*2);

 	return function(rgbcolor){
 		universe_big(rgbcolor);
 		universe_small(rgbcolor);
 	}
}

function createUniverseClient (size, ip, universeId) {

	console.log('createUniverseClient: '+universeId);
	var e131 = require('e131');
	var client = new e131.Client(ip);  // or use a universe 
	var packet = client.createPacket(size*3);
	var channelData = packet.getChannelData();
	packet.setSourceName('E1.31 client '+universeId);
	packet.setUniverse(universeId);

	return function fillAndSend (rgbcolor) {
		console.log(universeId+'<'+rgbcolor);
		for (var idx=0; idx<size; idx++) {
			_.each(rgbcolor, function(color, colorindex){
				channelData[idx*3+colorindex] = rgbcolor[colorindex];
			});
		}
		client.send(packet, function () {
			console.log('success sent to '+universeId);
		});
	} 
}