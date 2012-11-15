var express = require('express'),
    io = require('socket.io'),
    nodestatic = require('node-static'),
    async = require('async'),
    exec = require('child_process').exec;

var adjhour = -1;

var playHours = function() {
    var ar = [];
    for(var i = 8; i < (18+1); i++) {
        ar.push(i);
    }
    return ar;
}();
console.log('Playing on hours: '+playHours);

var Carillon = {
    init: function() {
        Carillon.hour = Carillon.fetchHour();
        
        async.whilst(function() {return true;},
            function(callback) {
                if(Carillon.hour!=Carillon.fetchHour()) {
                    Carillon.hour = Carillon.fetchHour();
                    Carillon.chime();
                }
                setTimeout(callback, 1000);
            },
            function (err) {}
        );
    },
    
    _chime: function() {
        if(playHours.indexOf(Carillon._fetchHour())!=-1) {
            console.log("chime");

            exec('play bells.wav', function (error, stdout, stderr) {
                if (error !== null) {
                    console.log('exec error: ' + error);
                }
            });
        }
    },
    
    chime: function(x) {
        if(typeof x == 'undefined') {
            x = Carillon.hour;
        }
        
        console.log("chime"+x);
        Carillon.x = x;
        
        exec('play doxology2.wav', function (error, stdout, stderr) {
            for(var i = 0; i < Carillon.x; i++) {
                setTimeout(Carillon._chime, 3000*(i+1));
            }
        });
    },
    
    _fetchHour: function() {
        return (new Date()).getHours() + adjhour;
    },
    
    fetchHour: function() {
        if(Carillon._fetchHour()==0) {
            return 12;
        } else {
            return Math.abs((Carillon._fetchHour() < 13) ? Carillon._fetchHour() : (12 - Carillon._fetchHour()));
        }
    }
};

console.log(Carillon._fetchHour() + ':' + Carillon.fetchHour());

var app = express(),
    server = require('http').createServer(app),
    io = io.listen(server),
    staticserver = new(nodestatic.Server)('./');

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
Carillon.init();

io.sockets.on('connection', function (socket) {
    socket.on('chime', function (data) {
        Carillon.chime();
    });
});

[ //static server
    '/',
    '/client.js',
    '/style.css',
    '/1140.css',
    '/ie.css',
    '/css3-mediaqueries.js',
    '/jquery-1.8.2.min.js'
].forEach(function(val, i, array) {
    app.get(val, function(req, res){
        staticserver.serve(req, res);
    });    
});