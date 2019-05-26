// Connect to server
var io = require('socket.io-client');

var five = require('johnny-five'),
  potentiometer;

const board = new five.Board();
var socket = io.connect('localhost:8080', { reconnect: true });

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
  potentiometer.on('change', function() {
    console.log(this.value);

    // Add a connect listener
    socket.emit('potentiometer', this.value);
  });
});

// References
//
// http://arduino.cc/en/Tutorial/AnalogInput
