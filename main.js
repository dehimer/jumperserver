'use strict';
 
var app = require('app');
var BrowserWindow = require('browser-window');
var configuration = require('./configuration');
var ipc = require('ipc');

var mainWindow = null;
var settingsWindow = null;

var params = configuration.readSettings('params') || {offlinetimeout:3000,triggerlevel:3};
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

    mainWindow.on('closed', function () {
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


ipc.on('settings-window:ready', function () {
	settingsWindow.webContents.send('settings-window:params', params);
});

ipc.on('settings-window:params', function (event, newParams) {
	params = newParams
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
});


ipc.on('main-window:ready', function (event, args) {
	onMainWindowRendered();
})

function onMainWindowRendered () {

	if(!mainWindow){
		return;
	}
	
	mainWindow.webContents.send('main-window:params', params);
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

server.on('message', function (data, remote) {

	var ip = remote.address;
	// console.log(data+'');
	
	var data = (data+'').split(' ');
	var id = data[0];
	var val = data[1]*1;

	var trigger = val > params.triggerlevel;

	var currDate = +(new Date());

	var clientExist = !!clients[id];
	if(!clientExist){
		clients[id] = {
			id:id
		};
	}

	clients[id].trigger = trigger;
	clients[id].val = val;
	clients[id].ip = ip;
	clients[id].lastdgram = currDate;



	if(!clientExist){
		configuration.saveSettings('clients', clients);
		mainWindow.webContents.send('main-window:clients', clients);
	}

	console.log(clients[id]);
	mainWindow.webContents.send('main-window:update-clients', clients[id]);

});

server.bind(PORT, HOST);