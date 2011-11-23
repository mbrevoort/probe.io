var data = require('./data')
  , fs = require('fs');

module.exports = function FsWriter(path) {
	var stream = fs.createWriteStream(path);
	stream.once('open', function(fd) {
		 data.on('signal', function(signal) {
		 	stream.write(JSON.stringify(signal) + "\n");
		 });
	});	
}


