'use strict';

var ipc = require('ipc');
var $ = require('jquery');

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



ipc.on('main-window:clients', renderClients);


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
function renderClients(clientsAr){
    var clientsCount = clientsAr.length;
    
    var markup = '';


    for(var idx=0;idx<clientsCount;idx++){
        var client = clientsAr[idx];
        var pos = client.pos;
        if(!pos){
            pos = [window.innerWidth/2-25, window.innerHeight/2-25]
        }
        // console.log(pos);
        markup += '<div class="clients__client" data-idx="'+idx+'" style="left:'+pos[0]+'px;top:'+pos[1]+'px;">';
            markup += '<div class="clients__client_id">'+client.id+'</div>';
            markup += '<div class="clients__client_ip">'+client.ip+'</div>';
        markup += '</div>';
    }

    clientsContentEl.html(markup);
    clientsContentEl.find('.clients__client').bind('mousedown', function (e) {

        var el = $(e.target);
        var idx = el.data('idx');

        // alert(shiftHolded);
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

            clientsContentEl.bind('mouseup', function(){
                clientsContentEl.unbind('mouseup');
                clientsContentEl.unbind('mousemove');
                // $(e.target).css('background-color', 'white');

                ipc.send('main-window:new-client-state', {id:clients[idx].id, pos:newPos})
            });
        }else{
            var lastColor = el.css('background-color');
            el.css('background-color', 'white');
            clientsContentEl.bind('mouseup', function(){
                clientsContentEl.unbind('mouseup');
                $(e.target).css('background-color', lastColor);
            });
        }
    })
}