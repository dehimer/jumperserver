'use strict';

var ipc = require('ipc');
var configuration = require('../configuration');

var clientsCountInput = document.querySelector('#clients-count');
var closeEl = document.querySelector('.close');
var addClient = document.querySelector('#add-client');

closeEl.addEventListener('click', function (e) {
    ipc.send('close-settings-window');
});

addClient.addEventListener('click', function (e) {
    ipc.send('add-client');
});