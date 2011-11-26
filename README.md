Probe.io
========

Probe.io is a simple tracking mechanism for Socket.io transport statistics. 

<a href="http://probe.brevoort.com"><img src="http://probe.brevoort.com/images/run.png"/></a>
<a href="http://probestats.brevoort.com"><img src="http://probe.brevoort.com/images/view.png"/></a>

Why?
====

Websockets and various Comet style fallbacks create the ability for the
server to push data to web clients, enabling a whole new catagory of 
realtime applicaitons. However each transport (e.g websocket, flashsocket, xhr-polling)
comes with it's own advantages and disadvantages. For example, websockets
are arguably the most efficient transport but their use can be riddled 
with network related issues such as incompatability with proxies, firewalls, etc.

Probe.io was created to better understand the characteristics of the transports
leveraged by [Socket.io](http://socket.io) to make more informed decisions as to what 
transports to support in your applications.

My hope is that through community, we can generate enough diverse test data to more
accurately assess the sitution.

Probe
=====

The probe test can be [run directly](http://probe.brevoort.com) or embedded into any web page with a single
line javascript include like this:

	<script src="http://probe.brevoort.com/js/probe-include.js" type="text/javascript" defer="defer"></script>

The probe will attempt to run the following transports in your browser:

	'websocket', 'xhr-polling', 'flashsocket', 'htmlfile', 'jsonp-polling'

In most cases, Socket.io will only attempt to run a subset of this list for each
browser based on feature detection and browser capabilities.

The probe captures the following data:

* time to connect
* time to disconnect
* average rount trip time (RTT) to send a ping and pong messages, client -> server, server -> client
* time to push 10 small messages serially from server -> client
* total time of the test
* browser user agent details
* client IP (to be used in the future to estimate geographical physical distance from client to server)

**Note IE6 is not supported**

Data and Statistics
===================

The probe publishes it's results back to the server via an image beacon. These results
are currently being stored in [CouchDB](http://couchdb.apache.org/) database, generously hosted by [IrisCouch](http://www.iriscouch.com/) for free. 
All of the data is open and accessible, and through Couch, you can easily replicate the data as well. 

Basic aggregate statistics can be viewed [here](http://probestats.brevoort.com).

Roadmap
=======

* Calculate estimated geographical distance
* Improve error detection when transports fail
* Additional charts
* Add a more real world scenario to the probe tests
* Track Socket.io transport selection and fallback attempts.

