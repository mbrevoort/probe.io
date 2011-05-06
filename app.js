var io = require('socket.io')
  , express = require('express');
    

///////////////////////////////////////////////////////////////////////////////
// express app configuration
///////////////////////////////////////////////////////////////////////////////

var app = express.createServer();
app.configure(function(){
    //app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
});

module.exports = app;

///////////////////////////////////////////////////////////////////////////////
// image beacon reporting rout
///////////////////////////////////////////////////////////////////////////////

// This is the signal receiver which will be requested by the client image beacon
// request, passing up the stats as parameters
app.get("/signal", function(req, res) {

    // read the query parameters into stats and clean them up and augment before 
    // storing the signal details in the database
    var stats = req.query;
    delete stats.nocache;
    stats.ua = req.headers["user-agent"]
    
    // TODO: send to the database

    console.log("received signal", stats);
});

// we should only require one javascript include rather than needing to separately 
// requesting socket.io and then socket.io-probe.js.
// Aggregate and compact the two or perhaps this happens at build time so it can be
// compressed as well.
app.get("/probe.js", function(req, res) {
   // 1st get and stream socket.io client
   
   // then socket.io-probe.js right behind it. 
});

///////////////////////////////////////////////////////////////////////////////
// configure  socket.io 
///////////////////////////////////////////////////////////////////////////////

var socket = io.listen(app); 

socket.on('connection', function(client) {
    
    // once we have a new connection, record the time on the connection so we can
    // send the client a ping message and measure how long it takes to receive a
    // pong response. Once we receive the pong, we'll send the measurement down to 
    // the client
    client.server_send_time = (new Date().getTime());
    client.send("ping");
    
    // when we receive a message it will either be a pong response to the ping we 
    // sent just above or it will be a ping request from the client that we should respond
    // to with a pong
    client.on('message', function(message) {
        if(message === "ping")
            client.send("pong");
        else if(message === "pong") {
            client.send((new Date().getTime()) - client.server_send_time);
        }
    });
    
    client.on('disconnect', function() {
        // placeholder in case we need to do anything on disconnect
    });
});

///////////////////////////////////////////////////////////////////////////////
// in case it's not started with cluster, allow to be started directly
///////////////////////////////////////////////////////////////////////////////
if(process.argv[1].indexOf("/app.js" ) !== -1) {
    (function() {
        this.port = parseInt(process.argv[2]) || 8080;
        app.listen(this.port);
        console.log("Listending on " + this.port);        
    }());
}