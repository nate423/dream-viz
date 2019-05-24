# dream-viz

# Background
This visualization uses delaunator.js and perlin.js to generate a triangle pattern based on a black and white image. When you move the cursor, the visualization reacts by exploding and moving around the pattern.

# Goal
Instead of cursor movement, we'd like to make this effect happen based on input from a sensor connected to an Arduino. It seems like this should be pretty straightforward using node.js and http://johnny-five.io/, but I get very lost very quickly once I start using Terminal and friends.

This YouTube video was incredibly helpful: https://www.youtube.com/watch?v=8s2--hfsJDY

# Progress
So with sensor.js, I've been able to successfully read from the Arduino sensor and show the value in Terminal:
```
potentiometer.on("change", function() {
  console.log(this.value);
});
  ```
  
http://johnny-five.io/examples/potentiometer/

However, because of my severe lack of understanding of node.js and servers and Javascript, I don't know how to use this value in other documents. Specifically, in logo.js I'd like to make this changing value cause the pattern effect, but I really have no idea where to start...
