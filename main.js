'use strict';

var COLORS_PORT = 5568;
var CLIENTS_PORT = 5567;

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
var clients = require('./libs/clients')({port:COLORS_PORT});
var lightHouse = require('./libs/lighthouse');
var selfip = require('./libs/selfip');
var params = require('./libs/params');

var mainWindow = null;

const mainWindowSizes = [540, 800];

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
	clients(state.id).update(state);
});


ipc.on('clients-panel:ready', function (event, args) {
	mainWindow.webContents.send('clients-panel:params', params.get());
	mainWindow.webContents.send('clients-panel:clients', clients().get());
})

var offlineTimeouts = {};
var selectedClientId;
var udpserver = UdpServer({
	host: selfip.get(params.get('iface')).address,
	port: CLIENTS_PORT,
	onmessage: function(args){

		var id = args.id;

		clients(id).handleMessage(args, function(err, result){

			// console.log('cb');

			//save and notice window
			if(result.newclient){
				mainWindow && mainWindow.webContents.send('clients-panel:clients', clients().get());
			}

			//send new state
			mainWindow && mainWindow.webContents.send('clients-panel:update-clients', clients(id).get());

			// if(+selectedClientId === +id){
			// 	mainWindow && mainWindow.webContents.send('settings-panel:selected-client-params', clients(id).get());
			// }


			//check offline
			if(!offlineTimeouts[id]){
				offlineTimeouts[id] = {};
			}
		    clearTimeout(offlineTimeouts[id]);
		    offlineTimeouts[id] = setTimeout(function(){
		        if(clients(id).get()){
		        	console.log(id+' is timeout');
		        	clients(id).set({online: false});
		        }
		        mainWindow && mainWindow.webContents.send('clients-panel:update-clients', clients(id).get());
		    }, params.get('offlinetimeout'));

		});

	}
})


colorgenerator.start(params.get('fps'), function sendColor(color, clientId){

	var targetClients = _.filter(clients().get(), function(client){
		return client.online && ((typeof clientId === 'undefined') || client.id === clientId);
	});

	color = [color.r, color.g, color.b];

	// console.log(targetClients);
	//indicate color
	_.each(targetClients, function(client){
		// console.log(client);
		var id = client.id;
		var colorToSend = client.trigger?[255,255,255]:color; 
		// clients(id).set({color: colorToSend});
		clients(id).setOuterColor(colorToSend);
		clients(id).setInnerColor(colorToSend.reverse());
		clients(id).updateLeds();

		mainWindow && mainWindow.webContents.send('clients-panel:update-clients', clients(id).get());

	});
});

var lighthouse = new lightHouse({
	bip: selfip.get(params.get('iface')).broadcast,
	delay: 5000,
	message: 'hello',
	port: CLIENTS_PORT
});

ipc.on('settings-panel:change-iface', function(event, iface) {

	params.set('iface', iface);
	params.set('ip', selfip.get(iface).address);
	lighthouse.setBroadcastIP(selfip.get(params.get('iface')).broadcast);
	udpserver.setIP(selfip.get(iface).address);
	mainWindow.webContents.send('params', params.get());
});


ipc.on('reset', function () {
	selectedClientId = undefined;
	clients().reset();
	params.reset();
	lighthouse.setBroadcastIP(null);
	udpserver.setIP(null);
	colorgenerator.setFPS(params.get('fps'));
    mainWindow.webContents.send('clients-panel:clients', clients().get());
    mainWindow.webContents.send('params', params.get());
    mainWindow.webContents.send('settings-panel:selected-client-params', false);
});

ipc.on('settings-panel:params', function (event, newParams) {
	params.set(newParams)
	colorgenerator.setFPS(params.get('fps'));
	mainWindow.webContents.send('params', params.get());
});

ipc.on('clients-panel:selected-client', function(event, id) {
	selectedClientId = id;
	mainWindow && mainWindow.webContents.send('settings-panel:selected-client-params', clients(id).get());
});

ipc.on('settings-panel:current-client-change-level', function(event, level) {

	var id = selectedClientId;
	clients(id).set({
		triggerlevel:level
	});


	//send new state
	mainWindow && mainWindow.webContents.send('clients-panel:update-clients', clients(id).get());
	mainWindow && mainWindow.webContents.send('settings-panel:selected-client-params', clients(id).get());

});

ipc.on('settings-panel:calc-trigger-level', function(event) {
	
	var client = clients(selectedClientId);
	var vals = [];
	var processNextVal = function (val) {
		vals.push(val);
		// console.log('processNextVal '+val);
	};
	client.on('val', processNextVal);
	setTimeout(function(){

		var res = 10;
		if(vals.length){
			var sum = _.reduce(vals, function(buf, nextval) {
				return buf+nextval;
			}, 0);
			res += Math.floor(sum/vals.length);
		}
		// console.log(res);
		client.set({triggerlevel:res})
		// clients(id).calcLevel(false);
		client.removeListener('val', processNextVal);
		if(mainWindow){
			mainWindow.webContents.send('clients-panel:update-clients', client.get());
			mainWindow.webContents.send('settings-panel:selected-client-params', client.get());
			mainWindow.webContents.send('settings-panel:new-trigger-level');
		}
	}, 10000);
});