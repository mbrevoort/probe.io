(function(global) {
    
    var stats = {
        start_time: new Date().getTime(),
        connect_duration: -1,
        client_message_time: -1,
        client_message_duration: -1,
        disconnect_time: -1,
        disconnect_duration: -1,
        
        transport: "",
        remembered_transport: false,
    };
    
    function serializeStats() {
        var items = [];
        Object.keys(stats).forEach(function(key) {
            items.push(encodeURIComponent(key) + "=" + encodeURIComponent(stats[key]));
        });
        return items.join("&");
    }

    function sendSignal() {
        var img = document.createElement("img");
        var signalUri = "/signal?" + serializeStats() + "&nocache=" + Math.floor(Math.random()*1000000); 
        img.setAttribute('style', 'display:none;');
        img.setAttribute('src', signalUri);
        document.getElementsByTagName("body")[0].appendChild(img);     
    }

    
    var socket = new global.io.Socket();
    socket.connect();
    socket.on('connect', function(){
        var now = new Date().getTime();
        stats.connect_duration = now - stats.start_time;
        stats.transport = socket.transport && (socket.transport.type);
        stats.remembered_transport = socket._rememberedTransport || false;
        stats.client_message_time = now;

        console.log("connected", stats.connect_duration, stats, socket);        
        socket.send("ping");
    });
    
    socket.on('message', function(data){
        var now = new Date().getTime();
        if(data === "pong") {
            stats.client_message_duration = now - stats.client_message_time;
            console.log("received message", data, stats.client_message_duration, socket);            
        }
        else if(data === "ping") {
            socket.send("pong");
        }
        else  {
            stats.server_message_duration = data;
            stats.disconnect_time = now;
            socket.disconnect();
        }
        
    });
    
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