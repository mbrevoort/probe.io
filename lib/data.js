var config = require('../config.json')
  , rq = require('request')

exports.persistSignal = function(signal) {
    rq(
        {
            method: 'POST',
            uri: config.database_url,
            json: signal
        },
        function(error, response, body) {
            if(response.statusCode == 201){
                console.log('document saved');
            } else {
                console.log('error: '+ response.statusCode);
                console.log(body);
            }
        }
    );
};