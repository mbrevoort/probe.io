var data = require('./data')
  , fs = require('fs');

module.exports = function FsWriter(path) {
	var stream = fs.createWriteStream(path, { flags: 'a' });
	stream.once('open', function(fd) {
		console.log("opened " + path + " to write signal data");
		 data.on('signal', function(signal) {
		 	stream.write(JSON.stringify(signal) + "\n");
		 });
	});	
}


