var express = require('express'),
    io = require('socket.io'),
    nodestatic = require('node-static'),
    async = require('async'),
    exec = require('child_process').exec;
    
var Carillon = function() {
    this.fetchHour = function() {
        return Math.abs(12 - (new Date()).getHours());
    };
    this.hour = this.fetchHour();
    
    this._chime = function() {
        exec('play bells.wav', function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    };
    
    this.chime = function(x) {
        if(typeof x == 'undefined') {
            x = this.hour;
        }
        
        for(var i=0; i<x; i++) {
            setTimeout(this._chime, 3000*(i+1));
        }
    };
};

var app = express(),
    server = require('http').createServer(app),
    io = io.listen(server),
    staticserver = new(nodestatic.Server)('./'),
    carillon = new Carillon();

//socket.io production settings
io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging
io.set('transports', [                     // enable all transports (optional if you want flashsocket)
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

server.listen(5555);

io.sockets.on('connection', function (socket) {
    socket.on('chime', function (data) {
        carillon.chime();
    });
});

[ //static server
    '/',
    '/client.js',
    '/jquery-1.8.2.min.js'
].forEach(function(val, i, array) {
    app.get(val, function(req, res){
        staticserver.serve(req, res);
    });    
});

async.whilst(function() {return true;},
    function(callback) {
        if(carillon.hour!=carillon.fetchHour()) {
            carillon.hour = carillon.fetchHour();
            carillon.chime();
        }
        setTimeout(callback, 1000);
    },
    function (err) {}
);