(function(global) {
    
    var stats = {
        start_time: new Date().getTime(),
        connect_duration: -1,
        client_message_time: -1,
        client_message_duration: -1,
        disconnect_time: -1,
        disconnect_duration: -1,
        transport: ""
    };
    
    // return an ampersand deliminated ,key value, querystring representation of the stats
    function serializeStats() {
        var items = [];
        Object.keys(stats).forEach(function(key) {
            items.push(encodeURIComponent(key) + "=" + encodeURIComponent(stats[key]));
        });
        return items.join("&");
    }

    // Send the signal beacon results by inserting a hidden image tag at the end of the body
    // TODO: set a timeout to clean up the image tag?
    function sendSignal() {
        var img = document.createElement("img");
        var signalUri = "/signal?" + serializeStats() + "&nocache=" + Math.floor(Math.random()*1000000); 
        img.setAttribute('style', 'display:none;');
        img.setAttribute('src', signalUri);
        document.getElementsByTagName("body")[0].appendChild(img);     
    }

    // define a new socket and initiate a connection
    // TODO specify location of socket by figuring out what server this script was requested from
    var socket = new global.io.connect();
    
    // on connection, start timing and initialize the stats
    // then issue a ping on the connection
    socket.on('connect', function(){
        var now = new Date().getTime();
        stats.connect_duration = now - stats.start_time;
        stats.transport = socket.socket && socket.socket.transport && socket.socket.transport.name;
        stats.client_message_time = now;

        console.log("connected", stats.connect_duration, stats, socket);        
        socket.send("ping");
    });
    
    socket.on('message', function(data){
        var now = new Date().getTime();
        
        // if we receive a pong message it should be in response to our
        // ping message we sent. calculate the RTT from the client
        if(data === "pong") {
            stats.client_message_duration = now - stats.client_message_time;
            console.log("received message", data, stats.client_message_duration, socket);            
        }
        
        // if we receive a pint, we need to respond with a pong. The server sent
        // us a ping to measure RTT from the server perspective
        else if(data === "ping") {
            socket.send("pong");
        }
        
        // the only other message the server should send us should be the result of the
        // server RTT measurement. The contents of the message should be an integer representing
        // the millisecond duration of a server initiated message round trip ping/pong
        // TODO validate the message is an integer
        else  {
            stats.server_message_duration = data;
            
            // we're done, we don't need the socket anymore
            // TODO implement a timeout at each stage so we don't error out and orphan callbacks
            // and leave the socket open
            stats.disconnect_time = now;
            socket.disconnect();
        }
        
    });
    
    // when the socket disconnects, do whatever we can to cleanup. unregister listeners, wack
    // window.io, etc.
    // Also send the signal beacon reporting the results
    socket.on('disconnect', function(){
        var now = new Date().getTime();
        stats.disconnect_duration = now - stats.disconnect_time;
        sendSignal();
        console.log("disconnected", stats);    
        
        // remove the event handlers and try to eliminate any references tosocket
        socket.on('disconnect', null);
        socket.on('connect', null);
        socket.on('message', null);
        socket = null;
        delete global.io
    });
    
}(window));