var express = require('express'),
    app = require('express')(),
    config = require('./config/config'),
    http = require('http').Server(app),
    cookieParser = require('cookie-parser'),
    zipper = require('./src/apps-zipper'),
    requirejs = require('requirejs'),
    concat = require('concat-files');

app.use(cookieParser());

app.get('/', function (req, res) {
    sendAgent(req, res);
});

app.get('/app/js/*', function (req, res) {
    res.sendFile(__dirname + '/src/agent' + req._parsedUrl.pathname.substring(4));
});

app.get('/app/*', function (req, res) {
    sendAgent(req, res);
});

app.get('/js/*', function (req, res) {
    res.sendFile(__dirname + '/src/agent' + req._parsedUrl.pathname);
});

app.get('/css/*', function (req, res) {
    res.sendFile(__dirname + '/src/agent' + req._parsedUrl.pathname);
});

app.get('/compile', function (req, res) {
    var config = {
        baseUrl: "./src/agent/js",
        paths: {
            //        jquery: "some/other/jquery"
        },
        name: "app",
        out: "src/agent/js/app-built-tmp.js"
    };

    console.log('starting compilation...');

    requirejs.optimize(config, function (buildResponse) {
        console.log('compilation build response:');
        console.log(buildResponse);

        concat([
    'src/agent/js/contrib/angular.min.js',
    'src/agent/js/app-built-tmp.js',
    'src/agent/js/app.js'
  ], 'src/agent/js/app-built.js', function () {
            res.status(200).end('Compilation succeeded');
        });
    }, function (err) {
        res.status(501).end(err);
    });
});

app.get('/debug' , function (req, res) {
	console.log(req);
	res.send(req.headers);
});
		
zipper.initZipper(app);

http.listen(config.port, function () {
    console.log('listening on *:' + config.port);
});

function sendAgent(req, res) {
	res.cookie('magicWheelClientIP', req.headers['x-forwarded-for']||req.connection.remoteAddress, {
        path: '/'
    });
	
    res.sendFile(__dirname + '/src/agent/agent.html');
}