The purpose of socket_io_probe is to test certain aspects of the
negotiation, failure and sucess of socket.io protocol and connection
attempts. These results will be reported back to a central service that
will make the data publicly available.

Things to capture:

* transport attempted and result
* duration of time between the library loading and result
* RTT ping message trace after successful connection established
* useragent info: browser, version, platform, flash installed, etc.
* IP
* Track events per page load for correlation


General approach

* OOTB Socket.io-node
* results will be reported as an image beacon cross domain
* javascript served cross domain
* results stored in MongoDB


