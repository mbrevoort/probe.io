$(document).ready(function() {
  var jqxhr = $.get('/signals/_design/app/_view/byBrowser?group=true', function(data) {

    var stats = {}

    $.each(data.rows, function(i, row) {
      var browserVersion = row.key[0] + ' v' + row.key[1],
          transportName = row.key[2];
      stats[browserVersion] = stats[browserVersion] || { transports: {} };
      stats[browserVersion].transports[transportName] = row.value;
      if( (stats[browserVersion].total || 0 ) < row.value.count )
        stats[browserVersion].total = row.value.count;
    });

    console.log(stats);

    renderStats(stats);
  }, 'json');

  jqxhr.error(function(error) { console.log("error", error); });
});


function renderStats(stats) {
  var xAxisMax = calculateXAxisMax(stats);

  $.each(Object.keys(stats), function(i, browserKey) {
    var stat = stats[browserKey],
        data = [],
        series = [],
        numSeries = Object.keys(stat.transports).length,
        CONNECT = 0, S_RTT = 1*(numSeries+1), C_RTT = 2*(numSeries+1), DISCONNECT = 3*(numSeries+1),
        ticks = [[CONNECT + (Math.floor(numSeries/2)), "Connect"], [S_RTT + (Math.floor(numSeries/2)), "Server RTT"], [C_RTT + 
          (Math.floor(numSeries/2)), "Client RTT"], [DISCONNECT + (Math.floor(numSeries/2)), "Disconnect"]];

    $('#stats').append('<h1>' + browserKey + ' (' + stat.total + ')</h1>');

    $.each(Object.keys(stat.transports), function(j, transportKey) {
      var transport = stat.transports[transportKey];

      data = [[transport.connect, CONNECT+j], [transport.server_message_rtt, S_RTT+j], [transport.client_message_rtt, C_RTT+j], [transport.disconnect, DISCONNECT+j]]

      series.push({
        data: data,
        bars: { show: true, horizontal: true, align: "center", barWidth: 0.8 },
        label: transportKey + " (" + Math.floor(transport.count/stat.total*100) + "%)"
      });


    });

    var chartElement = $('<div style="width: 600px; height: 300px;"></div>');
    $('#stats').append(chartElement);
    $.plot(chartElement, series, { yaxis: { ticks: ticks }, xaxis: { max: xAxisMax }, series: {multiplebars: true}});

  })

  function calculateXAxisMax(stats) {
    var max = 0;
    $.each(Object.keys(stats), function(i, browserKey) {
      var stat = stats[browserKey];
      $.each(Object.keys(stat.transports), function(j, transportKey) {
        var transport = stat.transports[transportKey];
        max = (transport.client_message_rtt > max) ? transport.client_message_rtt : max;
        max = (transport.server_message_rtt > max) ? transport.server_message_rtt : max;
        max = (transport.disconnect > max) ? transport.disconnect : max;
        max = (transport.connect > max) ? transport.connect : max;
      });
    });
    return max;
  }



}