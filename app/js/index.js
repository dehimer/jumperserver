'use strict';

var _ = require('underscore');
var $ = require('jquery');
var electron = require('electron')
var ipc = electron.ipcRenderer;

var closeEl = $('.close');
var settingsEl = $('.settings');
var clientsEl = $('.clients');
var clientsCountEl = $('.clients-count');

closeEl.bind('click', function () {
    ipc.send('main-window:close');
});

settingsEl.bind('click', function () {
    ipc.send('settings-window:open');
});



/* SET CLIENTS COUNT FORM */
const clientsCount = {
    els: {
        main: clientsCountEl,
        input: clientsCountEl.find('.clients-count__input'),
        submit: clientsCountEl.find('.clients-count__button'),
    }
}
/* filter input */
clientsCount.els.input.bind('keydown', function (e) {

    let keyCode = e.keyCode;

    if(keyCode >= 96 && keyCode <= 105){
        keyCode -= 48;
    }
    // console.log(keyCode);
    const nextChar = String.fromCharCode(keyCode);
    if((/[0-9]/.test(nextChar))){
    }else if (keyCode === 8){

    }else{
        e.preventDefault();
        return false;
    }
});


/*
//now not needed
var params = {offlinetimeout:3000};
ipc.on('main-window:params', function(event, newParams){
    params = newParams;
});
*/
ipc.on('main-window:clients', renderClients);
ipc.on('main-window:update-clients', updateClient);



ipc.send('main-window:ready');


window.addEventListener('keydown', keyhandler(true));
window.addEventListener('keyup', keyhandler(false));
var shiftHolded = false;
function keyhandler(pressed){

    return function(event) {
        //shift
        if(event.keyCode == 16){
            shiftHolded = pressed;
            // console.log(shiftHolded);
            // ipc.send('keyboard', pressed);
        }
    }
}

var clientsContentEl = clientsEl.find('.clients__content');
var clients = {};
function renderClients(event, data){

    clients = data;

    var clientsAr = _.map(clients, function(val, id){
        return val;
    });

    console.log(clientsAr);

    var clientsCount = clientsAr.length;
    
    var markup = '';

    for(var idx=0;idx<clientsCount;idx++){
        var client = clientsAr[idx];
        console.log(client);
        var pos = client.pos;
        if(!pos){
            pos = [window.innerWidth/2-25, window.innerHeight/2-25]
        }
        // console.log(pos);
        // alert(idx+':'+client.id);
        markup += '<div class="clients__client" data-idx="'+idx+'" data-id="'+client.id+'" style="left:'+pos[0]+'px;top:'+pos[1]+'px;">';
            markup += '<div class="clients__client_id">'+client.id+'</div>';
            markup += '<div class="clients__client_ip">'+client.ip+'</div>';
            markup += '<div class="clients__client_val">'+client.val+'</div>';
        markup += '</div>';
    }

    clientsContentEl.html(markup);
    clientsContentEl.find('.clients__client').bind('mousedown', function (e) {

        var el = $(e.target);
        
        if(!el.hasClass('clients__client')){
            el = el.closest('.clients__client');
        }

        var idx = el.data('idx');
        var id = el.data('id');

        if(shiftHolded){
            var currPos = [el.offset().left, el.offset().top];
            var startMousePos = [e.pageX, e.pageY];
            var newPos = currPos;

            clientsContentEl.bind('mousemove', function(e){
                // $(e.target).css('background-color', 'white');
                var moveMousePos = [e.pageX, e.pageY];;
                var diffPos = [moveMousePos[0]-startMousePos[0], moveMousePos[1]-startMousePos[1]]; 
                newPos = [currPos[0]+diffPos[0], currPos[1]+diffPos[1]]
                el.css('left', newPos[0]);
                el.css('top', newPos[1]);
            });
            
            // el.css('background-color', 'red');

            clientsContentEl.bind('mouseup mouseout', function(){
                clientsContentEl.unbind('mouseup');
                clientsContentEl.unbind('mousemove');
                // $(e.target).css('background-color', 'white');

                ipc.send('main-window:new-client-state', {id:id, pos:newPos})
            });
        }else{
            el.addClass('clients__client--active');
            clientsContentEl.bind('mouseup mouseout', function(){
                clientsContentEl.unbind('mouseup');
                el.removeClass('clients__client--active');
            });
        }
    })
}

function updateClient(event, client){

    var clientEl = clientsContentEl.find('.clients__client[data-id="'+client.id+'"]');    

    if(client.online){
        clientEl.addClass('clients__client--online');
    }else{
        clientEl.removeClass('clients__client--online');
    }
    
    if(client.trigger){
        clientEl.addClass('clients__client--active');
    }else{
        clientEl.removeClass('clients__client--active');
    }
    

    clientEl.find('.clients__client_ip').html(client.ip);
    clientEl.find('.clients__client_val').html(client.val);
}