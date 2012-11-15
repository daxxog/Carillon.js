$(function() {
    $("#chime").click(function() {
        var socket = io.connect('http://192.168.1.135');
        socket.emit('chime');
    });
});