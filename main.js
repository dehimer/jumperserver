'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var globalShortcut = require('global-shortcut');
var configuration = require('./configuration');
var ipc = require('ipc');

var mainWindow = null;
var settingsWindow = null;

var clients = configuration.readSettings('clients') || [];
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
	clients = [];
    configuration.saveSettings('clients', clients);
    mainWindow.webContents.send('main-window:clients', clients);
});

ipc.on('main-window:new-client-state', function (event, state) {
	if(state.pos){
		clients[state.idx].pos = state.pos;
		configuration.saveSettings('clients', clients);
	}
});


ipc.on('main-window:set-clients-count', function (event, clientsCount) {
	
	clients = [];
	var lastpos = [];
	for(var i=0;i<clientsCount;i++){

		clients.push({
			id:i,
			ip:''
		});

	}
	console.log(clients);
	configuration.saveSettings('clients', clients)
	mainWindow.webContents.send('main-window:clients', clients);

});

ipc.on('main-window:ready', function (event, args) {
	onMainWindowRendered();
})

function onMainWindowRendered () {

	if(!mainWindow){
		return;
	}
    
    mainWindow.webContents.send('main-window:clients', clients);
}