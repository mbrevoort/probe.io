var config = require('../config.json')
  , data = require('./data')
  , rq = require('request')
  , util = require('util');

  exports.persistSignal = function(signal) {
};

module.exports = function CouchWriter(url) {

    data.on('signal', function(signal) {
        rq(
            {
                method: 'POST',
                uri: url,
                json: signal,
            },
            function(error, response) {
                if(response.statusCode == 201){
                    util.log('signal saved to CouchDB');
                } else {
                    util.log('error saving signal to CouchDB: '+ response.statusCode + ", signal: " + util.inspect(signal));
                }
            }
        );
    });
}
