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
    , {from:"/api/browser", to:'_view/byBrowser', query: { group: 'true'}}
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
      if( t.rtt && t.serial && t.connect)
        emit([doc.browser.family, doc.browser.v1, t.name], { 
          rtt: t.rtt, 
          serial: t.serial,
          connect: t.connect,
          disconnect: t.disconnect,
          count: 1
        });    
    });
  },
  reduce: function(keys, values, rereduce) {
    var rtt_accum = 0
      , serial_accum = 0
      , connect_accum = 0
      , disconnect_accum = 0
      , rtt_avg = 0
      , serial_avg = 0
      , connect_avg = 0
      , disconnect_avg = 0
      , count = 0;

    values.forEach(function(v) {
      rtt_accum += v.rtt * v.count;
      serial_accum += v.serial * v.count;
      connect_accum += v.connect * v.count;
      disconnect_accum += (v.disconnect || 0) * v.count;
      count += v.count;
    })

    rtt_avg = rtt_accum / count;
    serial_avg = serial_accum / count;
    connect_avg = connect_accum / count;
    disconnect_avg = disconnect_accum / count;

    return { 
      rtt: rtt_avg, 
      serial: serial_avg,
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
      if( !t.rtt || !t.serial )
        emit(doc._id, doc);  
    });
  }
}