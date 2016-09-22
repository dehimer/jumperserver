'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var globalShortcut = require('global-shortcut');
var configuration = require('./configuration');
var ipc = require('ipc');

var mainWindow = null;
var settingsWindow = null;

app.on('ready', function() {

    let clients = configuration.readSettings('clients');

    if (!clients) {
        configuration.saveSettings('clients', []);
    }

    mainWindow = new BrowserWindow({
        frame: false,
        height: 500,
        resizable: false,
        width: 600
    });

    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

});

ipc.on('close-main-window', function () {
    app.quit();
});

ipc.on('open-settings-window', function () {
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

ipc.on('close-settings-window', function () {
    if (settingsWindow) {
        settingsWindow.close();
    }
});

ipc.on('add-client', function () {

    let clients = configuration.readSettings('clients') || [];
    clients.push({
        id: void 0,
        online: false,
        ip: void 0
    });
    configuration.saveSettings('clients', clients);

});