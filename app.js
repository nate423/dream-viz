const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);

var five = require('johnny-five'),
  potentiometer;

const board = new five.Board();

const SERVER_PORT = 3000;

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + 'index.html');
});

app.use((req, res) => {
  res.status(404).json({
    message: 'Resource not found'
  });
});

io.on('connection', (socket) => {
  console.log('Connection has been established with browser.');
  socket.on('disconnect', () => {
    console.log('Browser client disconnected from the connection.');
  });
});

http.listen(process.env.PORT || SERVER_PORT, () => {
  console.log(`Server started on the http://localhost:${SERVER_PORT}`);
});

board.on('ready', function() {
  // Create a new `potentiometer` hardware instance.
  potentiometer = new five.Sensor({
    pin: 'A0',
    freq: 250
  });

  // Inject the `sensor` hardware into
  // the Repl instance's context;
  // allows direct command line access
  board.repl.inject({
    pot: potentiometer
  });

  // "data" get the current reading from the potentiometer
  potentiometer.on('data', function() {
    console.log(this.value);

    socket.emit('value', this.value);
  });
});
