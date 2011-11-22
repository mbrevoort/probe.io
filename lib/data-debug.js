var util = require('util')

exports.persistSignal = function(signal) {
  util.log("Received Signal: " + util.inspect(signal));
};