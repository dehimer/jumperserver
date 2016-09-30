'use strict';

var electron = require('electron')
var ipc = electron.ipcRenderer;
var $ = require('jquery');
 
var _ = require('underscore');
// initialize single slider
// var slider = document.querySelector('.settings__trigger-level');
// rangesliderJs.create(slider,{ /* options -see below */ });

var resetClients = $('.settings__reset-clients');
var acceptParamsEl = $('.settings__accept-params');
var ifaceButtonEl = $('.settings__iface-button');

resetClients.bind('click', function (e) {
    ipc.send('reset-clients');
    ipc.send('settings-window:close');
});


var triggerlevelEl = $('.settings__trigger-level');
var offlinetimeoutEl = $('.settings__offline-timeout')

acceptParamsEl.bind('click', function (e) {
    
    var params = {
	    triggerlevel: triggerlevelEl.val(),
		offlinetimeout: offlinetimeoutEl.val()
    }
    ipc.send('settings-window:params', params);
    ipc.send('settings-window:close');
});

ipc.send('settings-window:ready');

ipc.on('settings-window:params', function(event, params){
	triggerlevelEl.val(params.triggerlevel);
	offlinetimeoutEl.val(params.offlinetimeout);
    ifaceButtonEl.val('haha');
});

ipc.on('settings-window:ifaces', function(event, ifaces){

    ifaceButtonEl.val() 

    var markup = _.map(ifaces, function(iface_data, iface_name) {
        return '<li><a href="#" data-iface_name="'+iface_name+'" class="settings__ifaces-list-item">'+iface_data.address+' ('+iface_name+')'+'</a></li>';
    })
    $('.settings__ifaces-list').html(markup);
    $('.settings__ifaces-list').find('.settings__ifaces-list-item').bind('click', function(){
        var iface_name = $(this).data('iface_name');
        // var ip = ifaces[iface_name].address;
        
        ipc.send('settings-window:change-iface', iface_name);

    });
    
    
});