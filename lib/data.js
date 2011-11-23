var config = require('../config.json')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')


var Data = function Data() {}
Data.prototype.__proto__ = EventEmitter.prototype;

Data.prototype.signal = function signal(signal) {
    this.emit('signal', signal);
}

module.exports = new Data();

