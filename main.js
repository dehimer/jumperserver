'use strict';

//sugar libs
var _ = require('underscore');
 
//electron libs
var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipc = electron.ipcMain;

//self written libs
var settings = require('./libs/settings');
var UdpServer = require('./libs/udpserver');
var colorgenerator = require('./libs/colorgenerator');
var clients = require('./libs/clients');
var lightHouse = require('./libs/lighthouse');
var selfip = require('./libs/selfip');
var params = require('./libs/params')


var mainWindow = null;

const mainWindowSizes = [500, 800];

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
    });
    
});

ipc.on('close', function () {
    app.quit();
});


ipc.on('settings-panel:ready', function () {
	mainWindow.webContents.send('settings-panel:params', params.get());
	mainWindow.webContents.send('settings-panel:ifaces', selfip.get());
});

ipc.on('clients-panel:new-client-state', function (event, state) {
	clients.update(state);
});


ipc.on('clients-panel:ready', function (event, args) {
	mainWindow.webContents.send('clients-panel:params', params.get());
	mainWindow.webContents.send('clients-panel:clients', clients.get());
})

var offlineTimeouts = {};
var udpserver = UdpServer({
	host: selfip.get(params.get('iface')).address,
	port: 3000,
	onmessage: function(args){
		
		var ip = args.ip;
		var id = args.id;
		var val = args.val;


		var trigger = val > params.get('triggerlevel');
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
			mainWindow && mainWindow.webContents.send('clients-panel:clients', clients.get());
		}

		//send new state
		mainWindow && mainWindow.webContents.send('clients-panel:update-clients', clients.get(id));


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
	        mainWindow && mainWindow.webContents.send('clients-panel:update-clients', clients.get(id));
	    }, params.get('offlinetimeout'));
	}
})


colorgenerator.start(params.get('fps'), function sendColor(color, clientId){

	var targetClients = _.filter(clients.get(), function(client){
		return client.online && ((typeof clientId === 'undefined') || client.id === clientId);
	});

	color = [color.r, color.g, color.b];

	//indicate color
	_.each(targetClients, function(client){
		var id = client.id;
		var colorToSend = client.trigger?[255,255,255]:color; 
		clients.set(id, {color: colorToSend});

		mainWindow && mainWindow.webContents.send('clients-panel:update-clients', clients.get(id));

	});
});

var lighthouse = new lightHouse(selfip.get(params.get('iface')).broadcast, 5000, 'hello');

ipc.on('settings-panel:change-iface', function(event, iface) {

	params.set('iface', iface);
	params.set('ip', selfip.get(iface).address);
	lighthouse.setBroadcastIP(selfip.get(params.get('iface')).broadcast);
	udpserver.setIP(selfip.get(iface).address);
	mainWindow.webContents.send('params', params.get());
});


ipc.on('reset', function () {
	clients.reset();
	params.reset();
	lighthouse.setBroadcastIP(null);
	udpserver.setIP(null);
	colorgenerator.setFPS(params.get('fps'));
    mainWindow.webContents.send('clients-panel:clients', clients.get());
    mainWindow.webContents.send('params', params.get());
});

ipc.on('settings-panel:params', function (event, newParams) {
	params.set(newParams)
	colorgenerator.setFPS(params.get('fps'));
	mainWindow.webContents.send('params', params.get());
});