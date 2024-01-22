// NOTE : - to launch the server : node program.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');   

// 1- Create Node server
const app = express();
const server = http.createServer(app);
app.use(cors());

//------------------------------------------------------------------
// 2 - create socket-io websocket, and client will subscribe to it
//--------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: '*', // Replace with your client's origin example http://your-client-origin
    methods: ['GET', 'POST'],
  },
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected');

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


//--------------------------------------------------------------
// 3 - create a MQTT client to connect to TheThingNetwork.org
//--------------------------------------------------------------
const TTN_BROKER = 'eu1.cloud.thethings.network';
const TTN_PORT = 1883;
const TTN_APP_ID = 'mt-1@ttn';
const TTN_ACCESS_KEY = 'NNSXS.66MIVPWI45SZ52HBLD2SFSJFK3ONMU6LPANDGKY.OUM4RFBYBSRKAGLAYMEWCSZHE2NU4GUITDZPLQQOKDJQWVF7ANMA';

// MQTT client for TTN
const ttnClient = mqtt.connect(`mqtt://${TTN_BROKER}:${TTN_PORT}`, {
  username: TTN_APP_ID,
  password: TTN_ACCESS_KEY,
});

// MQTT subscription to TTN topics
ttnClient.on('connect', () => {
  console.log('Connected to TTN MQTT');

  ttnClient.subscribe(`v3/${TTN_APP_ID}/devices/lora1/up`); //Seb : change that is you have more trackers
});

ttnClient.on('message', (topic, message) => {
  // Forward TTN data to connected Socket.IO clients
  console.log(topic);
  io.emit('ttn-data', message.toString());
});

//----------------------------------------------------------
// Start the server
//----------------------------------------------------------
const PORT = 1888;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
