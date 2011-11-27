(function(global) {

    var stats = {
            time: (new Date).getTime(),
            transports: {},
            aborted: [],
            timedOut: [],
            io_version: io.version
        },
        debug = false,
        transportTimeout = null;

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

        // if there are not more transports, we're done
        if (transports.length === 0) return sendSignal();

        var transport = transports.shift(),
            stat = {},
            rttCount = 0,
            serialCount = 0,
            serial_start = null,
            disconnect_time = null,
            finished = false;
            start_time = (new Date).getTime();

        // each transport will have 10s to run, else timeout
        transportTimeout = setTimeout(function() {
            stat.name = transport;
            stats.timedOut.push(stat);
            abort();
        }, 10000);

        // if (transport == 'jsonp-polling' && navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
        //     abort();
        // }

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

            stat.connect = Math.round(now - start_time);
            stat.name = socket.socket && socket.socket.transport && socket.socket.transport.name;
            stat.rtt_start = now;

            log(transport + " connected", stat.connect, stat, socket);

            if (stat.name !== transport) abort();
            else socket.send("ping");


        });

        socket.on('message', function(data) {
            if(finished) return cleanup();
            
            var now = (new Date).getTime();

            // if we receive a pong message it should be in response to our
            // ping message we sent. calculate the averate RTT from the client for 5 iteratons
            if (data === "pong") {
                if (++rttCount === 5) {
                    stat.rtt = Math.round((now - stat.rtt_start) / rttCount);


                    serial_start = now;
                    socket.send("start serial");


                }
                else socket.send("ping");
            }
            else if (data === 'serial') {
                if(++serialCount === 5) {
                    stat.serial = now - serial_start;

                    // we're done, we don't need the socket anymore
                    // TODO implement a timeout at each stage so we don't error out and orphan callbacks
                    // and leave the socket open
                    socket.disconnect();
                }
            }

        });

        // when the socket disconnects, do whatever we can to cleanup. unregister listeners, wack
        // window.io, etc.
        // Also send the signal beacon reporting the results
        socket.on('disconnect', function() {
            if(finished) return cleanup();

            var now = (new Date).getTime();
            log(transport + " disconnected", stat);

            stat.disconnect = Math.round(now - disconnect_time);
            stat.total = Math.round(now - start_time);
            probeFinished(transport, stat);
        });

        socket.on('connect_failed', function() {
            if(finished) return cleanup();

            log("connect failed for " + transport);
            abort();
        });

        socket.on('error', function(error) {
            if(finished) return cleanup();

            abort();
            log("error", error);
        });

        function cleanup() {
            finished = true;
            if(transportTimeout) clearTimeout(transportTimeout);
            if(socket) {
                socket.removeAllListeners('disconnect');
                socket.removeAllListeners('connect');
                socket.removeAllListeners('message');
                socket.disconnect();
                socket = null;
            }
        }

        function abort() {
            log("aborting transport " + transport);

            stats.aborted.push(transport);
            stat.name = transport;
            global.PROBE_TRANSPORT && global.PROBE_TRANSPORT(stat, false);
            cleanup();
            probeTransport(transports);
        }

        function probeFinished(transport, stat) {
            if (stat.name == transport) {
                stats.transports[transport] = stat;
                global.PROBE_TRANSPORT && global.PROBE_TRANSPORT(stat, true);
                cleanup();
                probeTransport(transports);
            }
            
        }

    }

    probeTransport(['websocket', 'xhr-polling', 'flashsocket', 'htmlfile', 'jsonp-polling']);

    function log() {
        debug && global.console && global.console.log && global.console.log(arguments);
    }


}(window));