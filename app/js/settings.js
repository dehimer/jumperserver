'use strict';

var ipc = require('ipc');
var $ = require('jquery');
var configuration = require('../configuration');

var clientsCountInput = $('#clients-count');
var closeEl = $('.close');
var addClientEl = $('#reset-clients');
var acceptParamsEl = $('#accept-params');


closeEl.bind('click', function (e) {
    ipc.send('settings-window:close');
});

addClientEl.bind('click', function (e) {
    ipc.send('reset-clients');
    ipc.send('settings-window:close');
});


var triggerlevelEl = $('.trigger-level');
var offlinetimeoutEl = $('.offline-timeout')

acceptParamsEl.bind('click', function (e) {
    
    var params = {
	    triggerlevel: triggerlevelEl.val(),
		offlinetimeout: offlinetimeoutEl.val()
    }
    ipc.send('settings-window:params', params);
    ipc.send('settings-window:close');
});

ipc.send('settings-window:ready');

ipc.on('settings-window:params', function(params){
	triggerlevelEl.val(params.triggerlevel);
	offlinetimeoutEl.val(params.offlinetimeout);
});