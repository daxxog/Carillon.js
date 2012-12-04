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

Date.prototype.equals = function(date) { //check if a date(time) equals another date(time)
    return this.getTime() == date.getTime();
};

Date.prototype.stripTime = function() { //remove the time from a date
    return new Date(this.getFullYear(), this.getMonth(), this.getDate());
};

Date.prototype.plus = function(time, multiplier) { //date + time*multiplier
    if(typeof multiplier == 'undefined') {
        multiplier = 'ms';
    }
    
    var mult = {
        'ms': 1,
        'sec': 1000,
        'min': 1000*60,
        'hour': 1000*60*60,
        'day': 1000*60*60*24,
        'week': 1000*60*60*24*7
    };
    
    return new Date(this.getTime() + time * mult[multiplier]);
};

Date.prototype.doomsday = function() { //"Computer formula for the Doomsday of a year", simplified http://en.wikipedia.org/wiki/Doomsday_rule#Computer_formula_for_the_Doomsday_of_a_year
    /* Day of week is an Integer 0-6
     * Sunday , Monday, Tuesday, Wednesday , Thursday, Friday , and Saturday
     * Noneday, Oneday, Twosday, Treblesday, Foursday, Fiveday, and Six-a-day
     */

    if(typeof this._doomsday_cache == 'undefined') { //if the doomsday is not cached
        this._doomsday_cache = Math.round(((497*this.getFullYear()/400) + 2) % 7); //calculate and cache the doomsday
    }
    
    return this._doomsday_cache; //return the cached doomsday
};

Date.prototype.thanksgiving = function() {
    if(typeof this._thanksgiving_cache == 'undefined') { //if Thanksgiving day is not cached
        var t = [ //Thanksgiving day in relation to doomsday
            25, //Sunday
            24, //Monday
            23, //Tuesday
            22, //Wednesday
            28, //Thursday
            27, //Friday
            26, //Saturday
        ];
        this._thanksgiving_cache = new Date(this.getFullYear(), 10, t[this.doomsday()]); //calculate and cache Thanksgiving day
    }
    
    return this._thanksgiving_cache; //return cached Thanksgiving day for this year 
};

Date.prototype.advent = function() {
    if(typeof this._advent_cache == 'undefined') { //if Advent Sunday is not cached
        var m = [ //Advent Sunday month in relation to doomsday
            10, //Sunday
            10, //Monday
            11, //Tuesday
            11, //Wednesday
            11, //Thursday
            10, //Friday
            10, //Saturday
        ];
        var t = [ //Advent Sunday in relation to doomsday
            28, //Sunday
            27, //Monday
            3, //Tuesday
            2, //Wednesday
            1, //Thursday
            30, //Friday
            29, //Saturday
        ];
        this._advent_cache = new Date(this.getFullYear(), m[this.doomsday()], t[this.doomsday()]); //calculate and cache Advent Sunday
    }
    
    return this._advent_cache; //return cached Thanksgiving day for this year 
};

Date.prototype.christmas = function() {
    return new Date(this.getFullYear(), 11, 25); //Christmas day for this year
};

Date.prototype.newyear = function() {
    return new Date(this.getFullYear()+1, 0, 1); //New years day (next year)
};

Date.prototype.diff = function(date, multiplier) { //find the difference between two dates
    if(typeof multiplier == 'undefined') {
        multiplier = 'ms';
    }
    
    var mult = {
        'ms': 1,
        'sec': 1000,
        'min': 1000*60,
        'hour': 1000*60*60,
        'day': 1000*60*60*24,
        'week': 1000*60*60*24*7
    };
    
    return (date.getTime() - this.getTime())/mult[multiplier];
};

Date.prototype.inRange = function(start, end) { //check if a date is in-between two dates
    var _ir = false;
    
    for(var i = 0; i<=start.diff(end, 'day'); i++) {
        if(this.equals(start.plus(i, 'day'))) {
            _ir = true;
        }
    }
    
    return _ir;
};

Array.prototype.shuffle = function () { //shuffle an Array
    for (var i = this.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = this[i];
        this[i] = this[j];
        this[j] = tmp;
    }

    return this;
};

var d = new Date();
console.log('Playing on hours: '+playHours);
console.log('Doomsday: ' + d.doomsday());
console.log('Advent sunday: ' + d.advent());
console.log('Thanksgiving: ' + d.thanksgiving());
console.log('Black Friday: ' + d.thanksgiving().plus(1, 'day'));

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
        console.log("chime");

        exec('play bells.wav', function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    },
    
    soundfile: function () {
        var d = new Date().stripTime();
        
        //play Thanksgiving music on Wednesday, Thursday, Friday, and Saturday
        if(d.inRange(d.thanksgiving().plus(-1, 'day'), d.thanksgiving().plus(2, 'day'))) {
            return [ //play some random Thanksgiving music
                './lsb/782.wav',
                './lsb/785.wav',
                './lsb/892.wav',
                './lsb/895.wav'
            ].shuffle()[0];
        
        //play Advent music from Advent Sunday - five days before Christmas
        } else if(d.inRange(d.advent(), d.christmas().plus(-5, 'day'))) {
            return [ //play some random Advent music
                './lsb/331.wav',
                './lsb/332.wav',
                './lsb/332.wav'
            ].shuffle()[0];
        
        //play Christmas music from four days before Christmas - the day before new years
        } else if(d.inRange(d.christmas().plus(-4, 'day'), d.newyears().plus(-1, 'day'))) {
            return [ //play some random Christmas music
                //'./lsb/331.wav',
                //'./lsb/332.wav',
                //'./lsb/332.wav'
            ].shuffle()[0];
        
        } else {
            return './doxology.wav'; //not a holiday, play the doxology
        }
    },
    
    chime: function(x) {
        if(playHours.indexOf(Carillon._fetchHour())!=-1) {
            if(typeof x == 'undefined') {
                x = Carillon.hour;
            }
            
            console.log("chime"+x);
            Carillon.x = x;
            exec('play '+Carillon.soundfile(), function (error, stdout, stderr) {
                for(var i = 0; i < Carillon.x; i++) {
                    setTimeout(Carillon._chime, 3000*(i+1));
                }
            });
        }
    },
    
    _fetchHour: function() {
        return (new Date()).getHours() + adjhour;
    },
    
    fetchHour: function() {
        if(Carillon._fetchHour()===0) {
            return 12;
        } else {
            return Math.abs((Carillon._fetchHour() < 13) ? Carillon._fetchHour() : (12 - Carillon._fetchHour()));
        }
    }
};

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