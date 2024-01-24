// NOTE : - to launch the server : node program.js
// This nodejs server do the following :
//    -create a socket.io for clients to connect to
//    -subscribe to TTN mosquitto (MQTT) messages
//    -redirect those messages to clients 
//    -and send firebase notification


//----Networks------------------------
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');
//----Firebase------------------------
const admin = require('firebase-admin');
const serviceAccount = require('./firebaseServiceAccountKey.json');
//----Sqlite------------------------
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('gotracker.db');
const { open } = require('sqlite');
const dbPromise = open({
  filename: 'gotracker.db',
  driver: sqlite3.Database
});

//------------------------------------------------------------------
// 0- Create Node server
//------------------------------------------------------------------
const app = express();
const server = http.createServer(app);
app.use(cors());

//------------------------------------------------------------------
// 1 - Initialize Firebase
//------------------------------------------------------------------

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const messaging = admin.messaging();

//----------------------------------------------------------------------------------------------
// 2 - create socket-io websocket for clients to subscribe to it and share their firebase token
//----------------------------------------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: '*', // Replace with your client's origin example http://your-client-origin
    methods: ['GET', 'POST'],
  },
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected');
  io.emit('client-connected', "ok");

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('firebase-token', (data) => {
    console.log("token coming from client");
    console.log(data);

    //Save token and deviceId
    const insertQuery = 'INSERT OR REPLACE INTO device (deviceId, firebaseToken ) VALUES (?, ?)';
    db.run(insertQuery, [data.deviceId, data.token], function (err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
  });
});

//-------------------------------------------------------------------------------
// 3 - subscribe to TTN events and get messages and trigger firebase notification
//--------------------------------------------------------------------------------
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

// Forward TTN data to connected Socket.IO clients and if activated send firebase notification
ttnClient.on('message', async (topic, message) => {
  const deviceId = decodeTTNMessage(message);
  try {
    const db = await dbPromise;
    const query = 'SELECT firebaseToken FROM device WHERE deviceId = ?';
    const row = await db.get(query, [deviceId]);
    if (row && row.firebaseToken) {
      const firebaseToken = row.firebaseToken;
      console.log(`Firebase Token for deviceName ${deviceId}: ${firebaseToken}`);

      // Trigger Firebase notification logic here using the retrieved token and the decoded message
      if(firebaseToken!=null) {
        console.log(`Sending Firebase notification to ${deviceId}`);
        sendFirebaseNotification(firebaseToken);
      }
    } else {
      console.log(`No Firebase Token found for deviceId ${deviceId}`);
    }
  } catch (error) {
    console.error('Error processing TTN message:', error.message);
  }

  io.emit('ttn-data', message.toString());
});

//----------------------------------------------------------
// Start the server
//----------------------------------------------------------
const PORT = 1888;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function decodeTTNMessage(message) {
  // Assuming the payload is in base64 format, decode it
  const decodedMessage = atob(message.toString('base64'));
  const jsonData = JSON.parse(decodedMessage);
  return jsonData.end_device_ids.device_id;
}

function sendFirebaseNotification(token) {
  const registrationToken = token;

  const message = {
    data: {
      key1: 'Bonjour',
      key2: 'Comment ca va ?',
    },
    notification:{
      title:"Who is the best pilot?",
      body:"The little Seb!"
    },
    token: registrationToken,
  };

  messaging.send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.error('Error sending message:', error);
    });
}