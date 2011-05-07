var config = require('../config.json')
  , rq = require('request')
  , util = require('util')

exports.persistSignal = function(signal) {
    rq(
        {
            method: 'POST',
            uri: config.database_url,
            json: signal
        },
        function(error, response) {
            if(response.statusCode == 201){
                util.log('document saved');
            } else {
                util.log('error: '+ response.statusCode + ", signal: " + signal);
            }
        }
    );
};