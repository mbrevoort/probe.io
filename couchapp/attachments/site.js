$(document).ready(function() {
  var jqxhr = $.get('/api/browser', function(data) {

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
        TOTAL = 0, RTT = 1*(numSeries+1), SERIAL = 2*(numSeries+1), CONNECT = 3*(numSeries+1),
        middle = Math.floor(numSeries/2),
        ticks = [[TOTAL + middle, "Total"], [RTT + middle, "RTT"], [SERIAL + middle, "Serial"], [CONNECT + middle, "Connect"]],
        elem = $('<div class="section"></div>');
    
    $('#stats').append(elem);
    elem.append('<h2>' + browserKey + '<span class="count">(' + stat.total + ')</span></h2>');

    $.each(Object.keys(stat.transports), function(j, transportKey) {
      var transport = stat.transports[transportKey];

      data = [[transport.total, TOTAL+j], [transport.rtt, RTT+j], [transport.serial, SERIAL+j], [transport.connect, CONNECT+j]]

      series.push({
        data: data,
        bars: { show: true, horizontal: true, align: "center", barWidth: 0.8 },
        label: transportKey + " (" + Math.floor(transport.count/stat.total*100) + "%)",
        color: color(transportKey)
      });


    });

    var chartElement = $('<div class="chart"></div>');
    elem.append(chartElement);
    $.plot(chartElement, series.reverse(), { 
      yaxis: { ticks: ticks }, 
      xaxis: { max: xAxisMax }, 
      series: {multiplebars: true}, 
      grid: { hoverable: true, clickable: true }
    });


    chartElement.bind("plothover", function (event, pos, item) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));

        if (item) {
            if (previousPoint != item.dataIndex) {
                previousPoint = item.dataIndex;
                
                $("#tooltip").remove();
                var x = item.datapoint[0].toFixed(2),
                    y = item.datapoint[1].toFixed(2);
                showTooltip(pos.pageX+15, pos.pageY+15, item.series.label + " " + x + "ms");
            }
        }
        else {
            $("#tooltip").remove();
            previousPoint = null;            
        }

    });

  })

  function calculateXAxisMax(stats) {
    return 2000;
    var max = 0;
    $.each(Object.keys(stats), function(i, browserKey) {
      var stat = stats[browserKey];
      $.each(Object.keys(stat.transports), function(j, transportKey) {
        var transport = stat.transports[transportKey];
        max = (transport.rtt > max) ? transport.rtt : max;
        max = (transport.serial > max) ? transport.serial : max;
        max = (transport.connect > max) ? transport.connect : max;
      });
    });
    return max;
  }

  function color(transport) {
    if(transport === 'xhr-polling') return '#EDC240';
    if(transport === 'websocket') return '#4DA74D';
    if(transport === 'jsonp-polling') return '#AFD8F8';
    if(transport === 'flashsocket') return '#CB4B4B';
    if(transport === 'htmlfile') return 'violet';
    return undefined;
  }

  function showTooltip(x, y, contents) {
      $('<div id="tooltip">' + contents + '</div>').css( {
          display: 'none',
          top: y + 5,
          left: x + 5,
          opacity: 0.90
      }).addClass('tooltip').appendTo("body").fadeIn(200);
  }


}