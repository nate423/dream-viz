const socket = io();

var WIDTH = 400 * 4;
var HEIGHT = 230 * 4;
var NUM_POINTS = 2000;

var points = [];
var canvas;
var context;
var t = 0;
var jitter = 0;
var minJitter = 5;

var lastMousePosition = { x: 0, y: 0 };
var lastTime = new Date();

var delaunay;

noise.seed(Math.random());

function generatePoints(image, numPoints) {
  var scratchCanvas = document.createElement('canvas');
  var scratchContext = scratchCanvas.getContext('2d');

  scratchCanvas.width = image.width;
  scratchCanvas.height = image.height;
  scratchContext.drawImage(image, 0, 0, WIDTH, HEIGHT);

  var imageData = scratchContext.getImageData(
    0,
    0,
    scratchCanvas.width,
    scratchCanvas.height
  );

  var points = [];
  for (var i = 0; i < numPoints; i++) {
    var x = Math.round(Math.random() * (imageData.width - 1));
    var y = Math.round(Math.random() * (imageData.height - 1));
    var color = imageData.data[y * (imageData.width * 4) + x * 4];
    while (color == 0) {
      x = Math.round(Math.random() * (imageData.width - 1));
      y = Math.round(Math.random() * (imageData.height - 1));
      color = imageData.data[y * (imageData.width * 4) + x * 4];
    }

    var p = [x, y];
    p.original = [x, y];
    points.push(p);
  }

  return points;
}

function drawPoints(points, context) {
  try {
    var delaunay = new Delaunator(points);

    for (var i = 0; i < delaunay.triangles.length; i += 3) {
      var p1 = points[delaunay.triangles[i]];
      var p2 = points[delaunay.triangles[i + 1]];
      var p3 = points[delaunay.triangles[i + 2]];
      drawLine(p1, p2, context);
      drawLine(p2, p3, context);
      // drawLine(p3, p1, context);
    }
  } catch (e) {}
}
//triangle size and line width
function drawLine(p1, p2, context) {
  var dx = p1[0] - p2[0];
  var dy = p1[1] - p2[1];
  var dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 50 && dist < 100) {
    context.lineWidth = 0.05;
    //dist *= 10;
    context.strokeStyle = lineColor(dist / 100);
  } else if (dist < 30 && dist > 20) {
    context.lineWidth = 0.05;
    //dist *= 10;
    context.strokeStyle = lineColor(dist / 100);
  } else if (dist < 20 && dist > 10) {
    context.lineWidth = 0.15;
    // dist *= 10;
    context.strokeStyle = lineColor(dist / 100);
  } else if (dist < 10 && dist > 3) {
    context.lineWidth = 0.25;
    // dist *= 10;
    context.strokeStyle = lineColor(dist / 100);
  } else if (dist < 3) {
    //dot size
    context.lineWidth = 5;
    //dist *= 10;
    context.strokeStyle = dotColor(dist / 100);
  } else {
    context.lineWidth = 0.001;
  }
  //context.strokeStyle = gray(dist / 100);

  context.beginPath();
  context.moveTo(p1[0], p1[1]);
  context.lineTo(p2[0], p2[1]);
  context.closePath();
  context.stroke();
}
//line color
function lineColor(value) {
  value = Math.min(Math.round(value), 255);
  return 'rgb(' + 255 + ',' + 255 + ',' + 255 + ')';
}
// dot color
function dotColor(value) {
  value = Math.min(Math.round(value), 255);
  return 'rgb(' + 255 + ',' + 0 + ',' + 255 + ')';
}

function draw() {
  var current = new Date();
  var elapsed = current - lastTime;
  lastTime = current;

  t += elapsed / 400;
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (var i = 0; i < points.length; i++) {
    points[i][0] =
      points[i].original[0] +
      noise.perlin3(points[i].original[0], points[i].original[1], t / 2) *
        (jitter + minJitter);
    points[i][1] =
      points[i].original[1] +
      noise.perlin3(points[i].original[0], points[i].original[1], t / 2 + 100) *
        (jitter + minJitter);
  }

  drawPoints(points, context);
  requestAnimationFrame(draw);

  jitter *= 0.95;
}

function mouseMove(event) {
  var velocityX = event.clientX - lastMousePosition.x;
  var velocityY = event.clientY - lastMousePosition.y;
  var speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

  jitter += speed / 2;

  lastMousePosition.x = event.clientX;
  lastMousePosition.y = event.clientY;
}

var logoImage = new Image();

logoImage.onload = function() {
  window.onmousemove = mouseMove;
  canvas = document.getElementById('logocanvas');
  context = canvas.getContext('2d');

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  points = generatePoints(logoImage, NUM_POINTS);
  delaunay = new Delaunator(points);

  requestAnimationFrame(draw);
};

logoImage.src = 'profile.png';

socket.on('value', (value) => {
  console.log(value);
  jitter = value;
});
