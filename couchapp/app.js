 var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc = 
  { _id:'_design/app'
  , views: {}
  , lists: {}
  , shows: {} 
  , rewrites : 
    [ {from:"/", to:'index.html'}
    , {from:"/api", to:'../../'}
    , {from:"/api/*", to:'../../*'}
    , {from:"/*", to:'*'}
    ]
  }
  ;

ddoc.views = {};

ddoc.validate_doc_update = function(newDoc, oldDoc, userCtx) {   
  if (userCtx.roles.indexOf('_admin') !== -1) { 
      return;   
  } else {
    throw({forbidden: 'Only admins may edit the database'});   
  }
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;

// http://probeio.iriscouch.com/signals/_design/app/_view/byBrowser?group=true
ddoc.views.byBrowser = {
  map: function(doc) {
    Object.keys(doc.transports).forEach(function(transport) {
      var t = doc.transports[transport];
      if( t.client_message_rtt && t.server_message_rtt && t.connect_duration )
        emit([doc.browser.family, doc.browser.v1, t.name], { 
          client_message_rtt: t.client_message_rtt, 
          server_message_rtt: t.server_message_rtt, 
          connect: t.connect_duration,
          disconnect: t.disconnect_duration,
          count: 1
        });    
    });
  },
  reduce: function(keys, values, rereduce) {
    var client_accum = 0
      , server_accum = 0
      , connect_accum = 0
      , disconnect_accum = 0
      , client_avg = 0
      , server_avg = 0
      , connect_avg = 0
      , disconnect_avg = 0
      , count = 0;

    values.forEach(function(v) {
      client_accum += v.client_message_rtt * v.count;
      server_accum += v.server_message_rtt * v.count;
      connect_accum += v.connect * v.count;
      disconnect_accum += (v.disconnect || 0) * v.count;
      count += v.count;
    })

    client_avg = client_accum / count;
    server_avg = server_accum / count;
    connect_avg = connect_accum / count;
    disconnect_avg = disconnect_accum / count;

    return { 
      client_message_rtt: client_avg, 
      server_message_rtt: server_avg, 
      connect: connect_avg,
      disconnect: disconnect_avg,
      count: count 
    };
  }
}


// http://probeio.iriscouch.com/signals/_design/app/_view/incompletes
ddoc.views.incompletes = {
  map: function(doc) {
    Object.keys(doc.transports).forEach(function(transport) {
      var t = doc.transports[transport];
      if( !t.client_message_rtt || !t.server_message_rtt )
        emit(doc._id, doc);  
    });
  }
}