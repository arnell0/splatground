var ws = require('ws');
var http = require('http');
var url = require('url');
const { v4 } = require('uuid');

const server = http.createServer();
const wssClient = new ws.WebSocketServer({ noServer: true });
const wssWorker = new ws.WebSocketServer({ noServer: true });

const newClients = []
const workers = []

wssClient.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    // console.log('received: %s', data);
  });

  const newClient = {
    id: v4(),
    socket: ws,
    worker: '',
  }
  newClients.push(newClient)
});

wssWorker.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    // console.log('received: %s', data);
  });

  const newWorker = {
    id: v4(),
    socket: ws,
    clients: [],
  }
  workers.push(newWorker)
  ws.send('Greetings worker your id is: ' + newWorker.id);
});




server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = url.parse(request.url);

  if (pathname === '/client') {
    wssClient.handleUpgrade(request, socket, head, function done(ws) {
      wssClient.emit('connection', ws, request);
    });
  } else if (pathname === '/worker') {
    wssWorker.handleUpgrade(request, socket, head, function done(ws) {
      wssWorker.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(8080);