#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var worker = new WebSocketClient();

worker.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

worker.on('connect', function(connection) {
    
    console.log('WebSocket Worker Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });
    
    // function sendNumber() {
    //     if (connection.connected) {
    //         var number = Math.round(Math.random() * 0xFFFFFF);
    //         connection.sendUTF(number.toString());
    //         console.log(number.toString())
    //     }
    // }
    // sendNumber();
});

worker.connect('ws://localhost:8080/worker', 'echo-protocol');