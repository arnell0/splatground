var ws = require('ws');
var http = require('http');
var url = require('url');
const { v4 } = require('uuid');

const maxClients = 2

const server = http.createServer();
const wssClient = new ws.WebSocketServer({ noServer: true });
const wssWorker = new ws.WebSocketServer({ noServer: true });

const clients = [] 
const workers = [] 
var currentWorker = 0

async function handleNewClient(newClient) {
  const getWorker = () => { // recursive "load-balancer", returns the next worker that's not busy
    if (workers[currentWorker].clients.length >= maxClients ) { // if worker is busy, move to the next
      if (workers.length == currentWorker) currentWorker = 0
      else currentWorker++
      getWorker()  // try next worker
    }
    const _worker = workers[currentWorker]
    currentWorker++
    return _worker
  }
  const _worker = getWorker()

  newClient["workersocket"] = _worker.socket
  _worker.clients.push(newClient)
  clients.push(newClient)

  const greeting = "Hi " + newClient.id + " your assigned worker are " + _worker.id
  sendMessage(newClient.socket, greeting)
}


wssClient.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    // console.log('received: %s', data);
  });

  const newClient = {
    id: v4(),
    socket: ws,
  }

  console.log("client connected with id: " + newClient.id)
  handleNewClient(newClient)
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
  console.log("worker connected with id: " + newWorker.id)
});


function sendMessage(receiver, message) {
  receiver.send(message)
}

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

