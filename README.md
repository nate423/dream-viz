# dream-viz
dream-viz

# Background
This visualization uses delaunator.js and perlin.js to generate a triangle pattern based on a black and white image. When you move the cursor, the visualization reacts by exploding and moving around the pattern.

# Goal
Instead of cursor movement, we'd like to make this effect happen based on input from a pressure sensor connected to an Arduino. It seems like this should be pretty straightforward using node.js and http://johnny-five.io/, but I get very lost very quickly once I start using Terminal and friends.

This guide seems quite helpful: https://hackernoon.com/create-your-first-arduino-node-js-iot-visualization-app-in-under-15-minutes-619f8e6f7181
And this YouTube video as well: https://www.youtube.com/watch?v=8s2--hfsJDY
