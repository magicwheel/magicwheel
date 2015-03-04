var app = require('express')();

//PEER SERVER
var ExpressPeerServer = require('peer').ExpressPeerServer;

var peerServer = app.listen(9000);

var options = {
    debug: true,
    allow_discovery: true
}   

app.use('/peerjs', ExpressPeerServer(peerServer, options));
