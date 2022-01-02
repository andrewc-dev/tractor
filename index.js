const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');

app.use(express.json());

(async () => {
  const client = createClient();

  client.on('error', (err) => console.log('Redis Client Error', err));

  await client.connect();

  // await client.set('key', 'value');
  // const value = await client.get('key');
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

  app.post('/api/game/:gameId', (req, res) => {

    await client.set('key', 'value');
  });

  app.post('/api/game/:gameId/join', (req, res) => {
    const { gameId } = req.params
    console.log('Joining game ID: ' + gameId);
    res.json({
      success: true,
      link: `http://localhost:3000/game/${gameId}`
    });
  })

  io.on('connection', (socket) => {
    socket.on('game id', (msg) => {
      console.log('Joining game ID: ' + msg);

    });
  });

  server.listen(3000, () => {
    console.log('listening on *:3000');
  });
})();
