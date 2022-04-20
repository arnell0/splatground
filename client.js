#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

var env = false
var i = 0
client.on('connect', function(connection) {
    const sendMessage = text => {
        var msgout = JSON.stringify({
            workerid: env.workerid,
            clientid: env.clientid,
            text
        })
        connection.sendUTF(msgout)
    }

    function sendMessageTimeout() {
        if (connection.connected) {
            sendMessage(i + " message from client")
            i++
            setTimeout(sendMessageTimeout, 1000)
        }
    }

    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    }); 
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            if (!env) {
                env = JSON.parse(message.utf8Data)
                console.log(env.greeting)
                
                sendMessageTimeout();
            } else {
                const msgin = JSON.parse(message.utf8Data)
                console.log(msgin.text)
            }
        }
    });
});

client.connect('ws://localhost:8080/client', 'echo-protocol');