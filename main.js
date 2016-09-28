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
var clients = require('./libs/clients');


var mainWindow = null;
var settingsWindow = null;

var params = configuration.readSettings('params') || {offlinetimeout:3000,triggerlevel:3};


const mainWindowSizes = [500, 600];

app.on('ready', function() {

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
	clients.reset();
    mainWindow.webContents.send('main-window:clients', clients.get());
});

ipc.on('main-window:new-client-state', function (event, state) {
	clients.update(state);
});



ipc.on('main-window:ready', function (event, args) {
	onMainWindowRendered();
})

function onMainWindowRendered () {

	if(!mainWindow){
		return;
	}
	
	// mainWindow.webContents.send('main-window:params', params);
    mainWindow.webContents.send('main-window:clients', clients.get());
}

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

		var clientExist = !!clients.get(id);

		//create
		if(!clientExist){
			clients.add(id, {
				id:id
			});
		}

		//update state
		clients.set(id, {
			trigger: trigger || clients.get(id).manualtrigger,
			val: val,
			ip: ip,
			lastdgram: currDate,
			online: true
		});

		//save and notice window
		if(!clientExist){
			mainWindow.webContents.send('main-window:clients', clients.get());
		}

		//send new state
		mainWindow && mainWindow.webContents.send('main-window:update-clients', clients.get(id));


		//check offline
		if(!offlineTimeouts[id]){
			offlineTimeouts[id] = {};
		}
	    clearTimeout(offlineTimeouts[id]);
	    offlineTimeouts[id] = setTimeout(function(){
	        if(clients.get(id)){
	        	console.log(id+' is timeout');
	        	clients.set(id, {online: false, color: undefined});
	        }
	        mainWindow && mainWindow.webContents.send('main-window:update-clients', clients.get(id));
	    }, params.offlinetimeout);
	}
})


colorgenerator.start(60, function sendColor(color, clientId){

	var targetClients = _.filter(clients.get(), function(client){
		return client.online && ((typeof clientId === 'undefined') || client.id === clientId);
	});

	color = [color.r, color.g, color.b];

	//indicate color
	_.each(targetClients, function(client){
		var id = client.id;
		var colorToSend = client.trigger?[255,255,255]:color; 
		clients.set(id, {color: colorToSend});

		mainWindow && mainWindow.webContents.send('main-window:update-clients', clients.get(id));

	});
});