var util = require('util')
  , data = require('./data');

module.exports = function DebugWriter() {
	data.on('signal', function(signal) {
		console.log(util.inspect(signal, false, 5)); 	
	});
};
