'use strict';

var _ = require('underscore'); 
var app = require('app');
var BrowserWindow = require('browser-window');
var configuration = require('./configuration');
var ipc = require('ipc');

var mainWindow = null;
var settingsWindow = null;

var clients = configuration.readSettings('clients') || {};
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

    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
    
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
        height: 120,
        resizable: false,
        width: 230
    });

    settingsWindow.loadUrl('file://' + __dirname + '/app/settings.html');

    settingsWindow.on('closed', function () {
        settingsWindow = null;
    });
});

ipc.on('settings-window:close', function () {
    if (settingsWindow) {
        settingsWindow.close();
    }
});


ipc.on('reset-clients', function () {
	clients = {};
    configuration.saveSettings('clients', clients);
    mainWindow.webContents.send('main-window:clients', clients);
});

ipc.on('main-window:new-client-state', function (event, state) {
	if(state.pos){
		clients[state.id].pos = state.pos;
		configuration.saveSettings('clients', clients);
	}
});


ipc.on('main-window:ready', function (event, args) {
	onMainWindowRendered();
})

function onMainWindowRendered () {

	if(!mainWindow){
		return;
	}

	var clientsAr = _.map(clients, function(val, id){
		val.id = id;
		return val;
	});
    
    mainWindow.webContents.send('main-window:clients', clientsAr);
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

server.on('message', function (data, remote) {

	var ip = remote.address;
	// console.log(data+'');
	
	var data = (data+'').split(' ');
	var id = data[0];
	var val = data[1];

	var currDate = +(new Date());

	var clientExist = !!clients[id];
	if(!clientExist){
		clients[id] = {};
	}

	clients[id].val = val;
	clients[id].ip = ip;
	clients[id].lastdgram = currDate;

	if(!clientExist){
		configuration.saveSettings('clients', clients);
		var clientsAr = _.map(clients, function(val, id){
			val.id = id;
			return val;
		});
		console.log('clientsAr');
		console.log(clientsAr);

		mainWindow.webContents.send('main-window:clients', clientsAr);
	}

	console.log(clients[id]);
	 

});

server.bind(PORT, HOST);