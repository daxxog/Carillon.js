$(function() {
    $("#chime").click(function() {
        var socket = io.connect('http://localhost');
        socket.emit('chime');
    });
});