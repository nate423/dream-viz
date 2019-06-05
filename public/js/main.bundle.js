(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

// These values are established by empiricism with tests (tradeoff: performance VS precision)
var NEWTON_ITERATIONS = 4;
var NEWTON_MIN_SLOPE = 0.001;
var SUBDIVISION_PRECISION = 0.0000001;
var SUBDIVISION_MAX_ITERATIONS = 10;

var kSplineTableSize = 11;
var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

var float32ArraySupported = typeof Float32Array === 'function';

function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
function C (aA1)      { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

function binarySubdivide (aX, aA, aB, mX1, mX2) {
  var currentX, currentT, i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}

function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
 for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
   var currentSlope = getSlope(aGuessT, mX1, mX2);
   if (currentSlope === 0.0) {
     return aGuessT;
   }
   var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
   aGuessT -= currentX / currentSlope;
 }
 return aGuessT;
}

function LinearEasing (x) {
  return x;
}

module.exports = function bezier (mX1, mY1, mX2, mY2) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }

  if (mX1 === mY1 && mX2 === mY2) {
    return LinearEasing;
  }

  // Precompute samples table
  var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
  for (var i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
  }

  function getTForX (aX) {
    var intervalStart = 0.0;
    var currentSample = 1;
    var lastSample = kSplineTableSize - 1;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    // Interpolate to provide an initial guess for t
    var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    var guessForT = intervalStart + dist * kSampleStepSize;

    var initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
    }
  }

  return function BezierEasing (x) {
    // Because JavaScript number are imprecise, we should guarantee the extremes are right.
    if (x === 0) {
      return 0;
    }
    if (x === 1) {
      return 1;
    }
    return calcBezier(getTForX(x), mY1, mY2);
  };
};

},{}],2:[function(require,module,exports){
const BezierEasing = require('bezier-easing');
const socket = io();

var WIDTH = 400 * 4;
var HEIGHT = 230 * 4;
var NUM_POINTS = 2000;

var points = [];
var canvas;
var context;
var t = 0;
var jitter = 5;

var ptmValue = 0;
var ifChange = 0;
var easeDur = 2000;

var lastMousePosition = { x: 0, y: 0 };
var lastTime = new Date();

var delaunay;

noise.seed(Math.random());

function generatePoints(image, numPoints, times) {
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
    p.previous = [x, y];
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

function easeTransition(point, easing) {
  var start = Date.now();
  (function loop() {
    var p = (Date.now() - start) / easeDur;
    if (p < 1) {
      requestAnimationFrame(loop);
      movePoint(point, easing(p));
    }
  })();
}

function movePoint(point, easing) {
  point.previous[0] =
    point.original[0] +
    noise.perlin3(point.original[0], point.original[1], t / 2) *
      ptmValue *
      easing;
  point.previous[1] =
    point.original[1] +
    noise.perlin3(point.original[0], point.original[1], t / 2 + 100) *
      ptmValue *
      easing;
}

function jitterPoint(point) {
  point[0] =
    point.previous[0] +
    noise.perlin3(point.previous[0], point.previous[1], t / 2) * jitter;
  point[1] =
    point.previous[1] +
    noise.perlin3(point.previous[0], point.previous[1], t / 2 + 100) * jitter;
}

function draw() {
  var current = new Date();
  var elapsed = current - lastTime;
  lastTime = current;

  t += elapsed / 400;
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (var i = 0; i < points.length; i++) {
    // Check if needs to update the points

    if (ifChange) {
      easeTransition(points[i], BezierEasing(0.25, 0.1, 0.0, 1.0));
    } else {
      jitterPoint(points[i]);
    }
  }

  // Reset
  ifChange = 0;

  drawPoints(points, context);
  requestAnimationFrame(draw);
}

function mouseMove(event) {
  var velocityX = event.clientX - lastMousePosition.x;
  var velocityY = event.clientY - lastMousePosition.y;
  var speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

  // jitter += speed / 2;

  lastMousePosition.x = event.clientX;
  lastMousePosition.y = event.clientY;
}

var logoImage = new Image();

logoImage.onload = function() {
  // window.onmousemove = mouseMove;
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
  ptmValue = value;
  ifChange = 1;
});

},{"bezier-easing":1}]},{},[2]);
