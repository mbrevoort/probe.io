(function(global) {

    var stats = {
        start_time: new Date().getTime(),
        transports: []
    };

    var debug = false;

    function serializeStats(stats) {
        return encodeURIComponent( global.io.JSON.stringify(stats) );
    }

    // Send the signal beacon results by inserting a hidden image tag at the end of the body
    // TODO: set a timeout to clean up the image tag?


    function sendSignal() {
        var img = document.createElement("img");
        var signalUri = "/signal?json=" + serializeStats(stats) + "&nocache=" + Math.floor(Math.random() * 1000000);
        img.setAttribute('style', 'display:none;');
        img.setAttribute('src', signalUri);
        document.getElementsByTagName("body")[0].appendChild(img);

        global.PROBE_SIGNAL && global.PROBE_SIGNAL(stats);
    }


    function probeTransport(transports) {
        if (transports.length === 0) return sendSignal();

        var transport = transports.shift(),
            stat = {},
            clientMessageCount = 0;

        // define a new socket and initiate a connection
        // TODO specify location of socket by figuring out what server this script was requested from
        var socket = new global.io.connect(undefined, {
            transports: [transport],
            'force new connection': true
        });

        // on connection, start timing and initialize the stats
        // then issue a ping on the connection
        socket.on('connect', function() {
            var now = new Date().getTime();
            stat.connect_duration = now - stats.start_time;
            stat.name = socket.socket && socket.socket.transport && socket.socket.transport.name;
            stat.client_message_time = now;

            debug && console.log("connected", stat.connect_duration, stat, socket);
            socket.send("ping");
        });

        socket.on('message', function(data) {
            var now = new Date().getTime();

            // if we receive a pong message it should be in response to our
            // ping message we sent. calculate the averate RTT from the client for 10 iteratons
            if (data === "pong") {
                if (++clientMessageCount === 10) stat.client_message_rtt = (now - stat.client_message_time) / clientMessageCount;
                else socket.send("ping");
            }

            // if we receive a ping, we need to respond with a pong. The server sent
            // us a ping to measure RTT from the server perspective
            else if (data === "ping") {
                socket.send("pong");
            }

            // the only other message the server should send us should be the result of the
            // server RTT measurement. The contents of the message should be an integer representing
            // the millisecond duration of a server initiated message round trip ping/pong
            else {
                stat.server_message_rtt = Number(data);

                // we're done, we don't need the socket anymore
                // TODO implement a timeout at each stage so we don't error out and orphan callbacks
                // and leave the socket open
                stat.disconnect_time = now;
                socket.disconnect();
            }

        });

        // when the socket disconnects, do whatever we can to cleanup. unregister listeners, wack
        // window.io, etc.
        // Also send the signal beacon reporting the results
        socket.on('disconnect', function() {
            var now = new Date().getTime();
            stat.disconnect_duration = now - stat.disconnect_time;
            probeFinished(transport, stat);
            debug && console.log("disconnected", stat);

            // remove the event handlers and try to eliminate any references tosocket
            socket.removeAllListeners('disconnect');
            socket.removeAllListeners('connect');
            socket.removeAllListeners('message');
            socket = null;
            probeTransport(transports);
        });
    }

    probeTransport(['websocket', 'xhr-polling', 'flashsocket']);

    function probeFinished(transport, stat) {
        if (stat.name == transport) stats.transports.push(stat);
    }

}(window));