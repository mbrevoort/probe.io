var io = require('socket.io'),
    express = require('express'),
    data = require('./lib/data.js'),
    //data_debug = new require('./lib/data-debug')(),
    //dataFilePath = process.argv[3] || __dirname + "/data.jsontxt",
    //dataFilewriter = new require('./lib/data-fs')(dataFilePath),
    useragent = require('useragent'),
    ONEBYONEGIF = new Buffer("R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", 'base64');

///////////////////////////////////////////////////////////////////////////////
// express app configuration
///////////////////////////////////////////////////////////////////////////////
var app = express.createServer();
app.configure(function() {
    //app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
});

module.exports = app;

if(process.env.COUCHDB_URL)
    var couchWriter = new require('./lib/data-couch.js')(process.env.COUCHDB_URL);


///////////////////////////////////////////////////////////////////////////////
// image beacon reporting rout
///////////////////////////////////////////////////////////////////////////////
// This is the signal receiver which will be requested by the client image beacon
// request, passing up the stats as parameters
app.get("/signal", function(req, res) {
    if (!req.query.json) return res.end(400);

    var stats = JSON.parse(req.query.json);
    stats.ua_raw = req.headers["user-agent"];
    var ua = useragent.parser(stats.ua_raw);
    stats.browser = {
        family: ua.family,
        v1: ua.V1,
        v2: ua.V2,
        v3: ua.V3
    };
    stats.os = {
        family: ua.os.family,
        v1: ua.os.V1,
        v2: ua.os.V2,
        v3: ua.os.V3
    };

    stats.referer = req.headers.referer;

    stats.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    data.signal(stats);
    //console.log("received signal", stats);
    res.setHeader("Content-Type", "image/gif");
    res.end(ONEBYONEGIF);

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
var io = io.listen(app);

io.configure(function() {
    io.set('transports', ['websocket', 'xhr-polling', 'flashsocket', 'htmlfile', 'jsonp-polling']);
    io.disable('log');

    // longer polling durations were causing the image beacon delivery to be delayed
    // when a request was hanging but not closed by the server
    io.set('polling duration', 11);
});

io.sockets.on('connection', function(client) {

    // when we receive a message it will be a ping request from the client that we should respond
    // to with a pong
    client.on('message', function(message) {
        if (message === 'ping') client.send('pong');

        if (message === 'start serial') {
            for(var i=0; i < 10; i++) {
                process.nextTick(function() { client.send("serial") });
            }
        }

    });

    client.on('disconnect', function() {
        // placeholder in case we need to do anything on disconnect
    });
});

///////////////////////////////////////////////////////////////////////////////
// in case it's not started with cluster, allow to be started directly
///////////////////////////////////////////////////////////////////////////////
if (process.argv[1].indexOf("/app.js") !== -1) {
    (function() {
        this.port = parseInt(process.argv[2]) || 8080;
        app.listen(this.port);
        console.log("Listending on " + this.port);
    }());
}