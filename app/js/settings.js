'use strict';

var ipc = require('ipc');
var configuration = require('../configuration');

var clientsCountInput = document.querySelector('#clients-count');
var closeEl = document.querySelector('.close');
var addClient = document.querySelector('#reset-clients');

closeEl.addEventListener('click', function (e) {
    ipc.send('settings-window:close');
});

addClient.addEventListener('click', function (e) {
    ipc.send('reset-clients');
    ipc.send('settings-window:close');
});