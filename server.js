var ws = require('ws');
var http = require('http');
var url = require('url');
const { v4 } = require('uuid');

// var found = obj.find(e => e.name === 'John');

const maxClients = 5

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
  console.log("new client to worker: " + _worker.id)

  var msg = JSON.stringify({
    workerid: _worker.id,
    clientid: newClient.id,
    greeting: "Hi Client my name is John Doe ..."
  })
  sendMessage(newClient.socket, msg)
}

async function handleNewWorker(newWorker) {   
  workers.push(newWorker)
  var msg = JSON.stringify({
    workerid: newWorker.id,
  })
  sendMessage(newWorker.socket, msg)
}


wssClient.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    const msg = JSON.parse(data)
    // console.log("Recieved message from client: " + msg.clientid + " to worker: " + msg.workerid)
    const worker = workers.find(e => e.id === msg.workerid);
    sendMessage(worker.socket, JSON.stringify(msg))
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
    const msg = JSON.parse(data)
    // console.log("Recieved message from worker: " + msg.workerid + " to client: " + msg.clientid)
    const client = clients.find(e => e.id === msg.clientid);
    sendMessage(client.socket, JSON.stringify(msg))
  });


  const newWorker = {
    id: v4(),
    socket: ws,
    clients: [],
  }
  handleNewWorker(newWorker)
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

