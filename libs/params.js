var _ = require('underscore');

var settings = require('./settings');
var defaultParams = {offlinetimeout:3000, triggerlevel:3};
var params = settings.read('params') || defaultParams;

var selfip = require('./selfip');

if(params.iface && selfip.get(params.iface)){
	params.ip = selfip.get(params.iface).address;
}

module.exports = {
	// save: function(newParams) {
	// 	params = newParams?newParams:params;
	// 	settings.save('params', params);
	// },
	reset: function() {
		params = defaultParams;
		settings.save('params', params);
	},
	get: function(name) {
		return name?params[name]:params;
	},
	set: function(arg1, arg2){

		if(arguments.length === 2){
			var name = arg1;
			var val = arg2;
			params[name] = val;
		}else if(arguments.length === 1){
			var newParams = arg1;
			params = newParams;
		}
		settings.save('params', params);
	}
}