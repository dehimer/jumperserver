'use strict';

var electron = require('electron')
var ipc = electron.ipcRenderer;
var $ = require('jquery');
 
var _ = require('underscore');
// initialize single slider
// var slider = document.querySelector('.settings__trigger-level');
// rangesliderJs.create(slider,{ /* options -see below */ });

var resetEl = $('.settings__reset');
var fpsEl = $('.settings__fps');
var acceptParamsEl = $('.settings__accept-params');
var ifaceButtonEl = $('.settings__iface-button');
var currentClientEl = $('.settings__current-client');

resetEl.bind('click', function (e) {
    ipc.send('reset');
});


var triggerlevelEl = $('.settings__trigger-level-slider');
var offlinetimeoutEl = $('.settings__offline-timeout')
var calcTrigLevel = $('.settings__calc-trigger-level');

acceptParamsEl.bind('click', function (e) {
    
    var params = {
		offlinetimeout: offlinetimeoutEl.val(),
        fps: fpsEl.val()
    }
    ipc.send('settings-panel:params', params);
});

calcTrigLevel.bind('click', function(){

    calcTrigLevel.addClass('settings__calc-trigger-level--active');

    ipc.send('settings-panel:calc-trigger-level');
});

ipc.on('settings-panel:new-trigger-level', function(event, level) {
    calcTrigLevel.removeClass('settings__calc-trigger-level--active');
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

    // triggerlevelEl.val(params.triggerlevel);
    offlinetimeoutEl.val(params.offlinetimeout);
    fpsEl.val(params.fps);

    if(params.ip){
        ifaceButtonEl.removeClass('btn-warning').addClass('btn-default');
        ifaceButtonEl.html(params.ip+' ('+params.iface+')');
    }else{
        ifaceButtonEl.removeClass('btn-default').addClass('btn-warning');
        ifaceButtonEl.html('Выберите IP');
    }
}

ipc.on('settings-panel:selected-client-params', function(event, clientParams) {
    // alert(!!clientParams);
    if(clientParams){
        currentClientEl.removeClass('settings__current-client--hidden');
        $('.settings__current-client-val').html(clientParams.val);
        $('.settings__trigger-level').html(clientParams.triggerlevel);
        triggerlevelEl.val(clientParams.triggerlevel);
        
    }else{
        currentClientEl.addClass('settings__current-client--hidden');
    }
})

triggerlevelEl.on('change', function(){
    var val = triggerlevelEl.val();
    ipc.send('settings-panel:current-client-change-level', val);
})