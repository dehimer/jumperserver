'use strict';

var nconf = require('nconf').file({file: getCurDir() + '/settings.json'});

function save(settingKey, settingValue) {
    nconf.set(settingKey, settingValue);
    nconf.save();
}

function read(settingKey) {
    nconf.load();
    return nconf.get(settingKey);
}

function getCurDir(){
	return process.env.PWD;
}

// function getUserHome() {
// 	console.log(process.env);
//     return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
// }

module.exports = {
    save: save,
    read: read
};
