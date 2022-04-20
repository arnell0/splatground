#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var worker = new WebSocketClient();

worker.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

var env = false
var i = 0

worker.on('connect', function(connection) {
    const sendMessage = (clientid, text) => {
        var msgout = JSON.stringify({
            workerid: env.workerid,
            clientid,
            text
        })
        connection.sendUTF(msgout)
    }

    console.log('WebSocket Worker Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            if (message.type === 'utf8') {
                if (!env) {
                    env = JSON.parse(message.utf8Data)
                } else {
                    const msgin = JSON.parse(message.utf8Data)
                    console.log(msgin.text)
                    
                    sendMessage(msgin.clientid, i + " message from worker")
                    i++
                }
            }
        }
    });
    

});

worker.connect('ws://localhost:8080/worker', 'echo-protocol');