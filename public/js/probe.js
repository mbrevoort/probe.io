(function(global) {

    var stats = {
        time: (new Date).getTime(),
        transports: {},
        aborted: [],
        io_version: io.version
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
            rttCount = 0,
            start_time = (new Date).getTime();

        io.transports = [transport];

        // define a new socket and initiate a connection
        // TODO specify location of socket by figuring out what server this script was requested from
        var socket = new global.io.connect(undefined, {
            transports: [transport],
            'try multiple transports': false,
            'force new connection': true,
            'reconnect': false
        });


        // on connection, start timing and initialize the stats
        // then issue a ping on the connection
        socket.on('connect', function() {
            var now = (new Date).getTime();

            stat.connect_duration = now - start_time;
            stat.name = socket.socket && socket.socket.transport && socket.socket.transport.name;
            stat.rtt_start = now;

            debug && console.log("connected", stat.connect_duration, stat, socket);

            if (stat.name !== transport) abort();
            else socket.send("ping");


        });

        socket.on('message', function(data) {
            var now = (new Date).getTime();

            // if we receive a pong message it should be in response to our
            // ping message we sent. calculate the averate RTT from the client for 5 iteratons
            if (data === "pong") {
                if (++rttCount === 5) {
                    stat.rtt = (now - stat.rtt_start) / rttCount;                    

                    // we're done, we don't need the socket anymore
                    // TODO implement a timeout at each stage so we don't error out and orphan callbacks
                    // and leave the socket open
                    socket.disconnect();

                }
                else socket.send("ping");
            }




        });

        // when the socket disconnects, do whatever we can to cleanup. unregister listeners, wack
        // window.io, etc.
        // Also send the signal beacon reporting the results
        socket.on('disconnect', function() {
            var now = (new Date).getTime();
            stat.disconnect_time = now;
            stat.disconnect_duration = now - stat.disconnect_time;
            probeFinished(transport, stat);
            debug && console.log("disconnected", stat);
            cleanup()

        });

        socket.on('connect_failed', function() {
            window.console && window.console.log && window.console.log("connect failed for " + transport);
            abort();
        });

        socket.on('error', function(error) {
            console.log("error", error);
        });

        function cleanup() {
            socket.removeAllListeners('disconnect');
            socket.removeAllListeners('connect');
            socket.removeAllListeners('message');
            socket = null;
            probeTransport(transports);
        }

        function abort() {
            window.console && window.console.log && window.console.log("aborting transport " + transport);
            stats.aborted.push(transport);
            cleanup();
        }


    }

    probeTransport(['websocket', 'xhr-polling', 'flashsocket', 'htmlfile', 'jsonp-polling']);

    function probeFinished(transport, stat) {
        if (stat.name == transport) stats.transports[transport] = stat;
    }


}(window));