'use strict';

var electron = require('electron')
var ipc = electron.ipcRenderer;
var $ = require('jquery');
 
var _ = require('underscore');
// initialize single slider
// var slider = document.querySelector('.settings__trigger-level');
// rangesliderJs.create(slider,{ /* options -see below */ });

var resetEl = $('.settings__reset');
var acceptParamsEl = $('.settings__accept-params');
var ifaceButtonEl = $('.settings__iface-button');

resetEl.bind('click', function (e) {
    ipc.send('reset');
});


var triggerlevelEl = $('.settings__trigger-level');
var offlinetimeoutEl = $('.settings__offline-timeout')

acceptParamsEl.bind('click', function (e) {
    
    var params = {
	    triggerlevel: triggerlevelEl.val(),
		offlinetimeout: offlinetimeoutEl.val()
    }
    ipc.send('settings-panel:params', params);
});

ipc.send('settings-panel:ready');

//params updated
ipc.on('params', function(event, params){;
	updatedparams(params);
});
ipc.on('settings-panel:params', function(event, params){;
    updatedparams(params);
});


ipc.on('settings-panel:ifaces', function(event, ifaces){

    ifaceButtonEl.val() 

    var markup = _.map(ifaces, function(iface_data, iface_name) {
        return '<li><a href="#" data-iface_name="'+iface_name+'" class="settings__ifaces-list-item">'+iface_data.address+' ('+iface_name+')'+'</a></li>';
    })
    $('.settings__ifaces-list').html(markup);
    $('.settings__ifaces-list').find('.settings__ifaces-list-item').bind('click', function(){
        var iface_name = $(this).data('iface_name');
        // var ip = ifaces[iface_name].address;
        ipc.send('settings-panel:change-iface', iface_name);

    });
    
    
});


function updatedparams(params){

    triggerlevelEl.val(params.triggerlevel);
    offlinetimeoutEl.val(params.offlinetimeout);
    if(params.ip){
        ifaceButtonEl.removeClass('btn-warning').addClass('btn-primary');
        ifaceButtonEl.html(params.ip+' ('+params.iface+')');
    }else{
        ifaceButtonEl.removeClass('btn-primary').addClass('btn-warning');
        ifaceButtonEl.html('Выберите IP');
    }
}