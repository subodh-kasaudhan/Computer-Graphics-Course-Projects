////////////////////////////////////////////////////////////////////////
// A simple WebGL program to draw simple 2D shapes.
//

var gl;
var color;
var animation;
var degree0 = 0;
var degree1 = 0;
var matrixStack = [];
var x = -1.1;
var change;

var index = 3;

// mMatrix is called the model matrix, transforms objects
// from local object space to world space.
var mMatrix = mat4.create();
var uMMatrixLocation;

var circleBuf;
var circleIndexBuf;

var sqVertexPositionBuffer;
var sqVertexIndexBuffer;

var aPositionLocation;
var uColorLoc;

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
  gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
  gl_PointSize = 3.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

uniform vec4 color;

void main() {
  fragColor = color;
}`;

function pushMatrix(stack, m) {
  //necessary because javascript only does shallow push
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack) {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function vertexShaderSetup(vertexShaderCode) {
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function fragmentShaderSetup(fragShaderCode) {
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, fragShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShaders() {
  shaderProgram = gl.createProgram();

  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragShaderCode);

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compilation and linking status
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  //finally use the program.
  gl.useProgram(shaderProgram);

  return shaderProgram;
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2"); // the graphics webgl2 context
    gl.viewportWidth = canvas.width; // the width of the canvas
    gl.viewportHeight = canvas.height; // the height
  } catch (e) {}
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

function initSquareBuffer() {
  // buffer for point locations
  const sqVertices = new Float32Array([
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 2;
  sqVertexPositionBuffer.numItems = 4;

  // buffer for point indices
  const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemsize = 1;
  sqVertexIndexBuffer.numItems = 6;
}

function initCircleBuffer() {
  // buffer for point locations
  vertices = [0, 0];
  circleIndices = [];
  const segments = 10; // Number of triangles used to approximate the circle
  const radius = 1;

  for (var i = 0.0; i <= 360.0; i += 10) {
    var rad = degToRad(i);
    vertices = vertices.concat([Math.sin(rad), Math.cos(rad)]);
    if (i < 360.0)
      circleIndices = circleIndices.concat([
        0,
        i / segments + 1,
        i / segments + 2,
      ]);
  }
  circleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  // temp1 = ;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  circleBuf.itemSize = 2;
  circleBuf.numItems = vertices.length / circleBuf.itemSize;

  // buffer for point indices
  // const squareIndices = new Uint16Array([0, 1, 2, 1, 2, 3]);
  circleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  // temp2 = ;
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(circleIndices),
    gl.STATIC_DRAW
  );
  circleIndexBuf.itemsize = 1;
  circleIndexBuf.numItems = circleIndices.length;
}

function drawSquare(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    sqVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  if (index == 2)
    gl.drawElements(
      gl.LINE_LOOP,
      sqVertexIndexBuffer.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  else if (index == 3)
    gl.drawElements(
      gl.TRIANGLES,
      sqVertexIndexBuffer.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  else
    gl.drawElements(
      gl.POINTS,
      sqVertexIndexBuffer.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
}

function drawCircle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    circleBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  if (index == 2)
    gl.drawElements(
      gl.LINE_LOOP,
      circleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  else if (index == 3)
    gl.drawElements(
      gl.TRIANGLES,
      circleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  else
    gl.drawElements(gl.POINTS, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}

function initTriangleBuffer() {
  // buffer for point locations
  const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  triangleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
  triangleBuf.itemSize = 2;
  triangleBuf.numItems = 3;

  // buffer for point indices
  const triangleIndices = new Uint16Array([0, 1, 2]);
  triangleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
  triangleIndexBuf.itemsize = 1;
  triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    triangleBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  if (index == 2)
    gl.drawElements(
      gl.LINE_LOOP,
      triangleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  else if (index == 3)
    gl.drawElements(
      gl.TRIANGLES,
      triangleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  else
    gl.drawElements(gl.POINTS, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}

////////////////////////////////////////////////////////////////////////
function house() {
  mat4.identity(mMatrix);
  color = [0.9647, 0.2274, 0, 1];
  // local rotation operation for the square
  // mMatrix = mat4.rotate(mMatrix, degToRad(20), [0, 0, 1]);
  // local scale operation for the square
  mMatrix = mat4.translate(mMatrix, [-0.5, -0.25, 0]);
  mMatrix = mat4.scale(mMatrix, [0.5, 0.25, 1.0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);

  mMatrix = mat4.translate(mMatrix, [-0.25, -0.25, 0]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 1.0]);
  drawTriangle(color, mMatrix);

  mMatrix = mat4.translate(mMatrix, [-2.0, 0.0, 0]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [1, 1, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);

  color = [0.87, 0.87, 0.87, 1];

  mMatrix = mat4.scale(mMatrix, [0.6, 0.25, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.83, -2, 1]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);

  color = [0.8627, 0.647, 0, 1];

  mMatrix = mat4.scale(mMatrix, [0.1, 0.175, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-5, -3.07, 1]);
  drawSquare(color, mMatrix);

  mMatrix = mat4.scale(mMatrix, [0.8, 0.48, 1]);
  mMatrix = mat4.translate(mMatrix, [2.4, 1, 0]);
  drawSquare(color, mMatrix);

  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [-4.7, 0, 0]);
  drawSquare(color, mMatrix);
}

function sun() {
  degree0 += 0.3;

  //draw square
  mat4.identity(mMatrix);

  color = [0.988, 0.8705, 0, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.56, 0.75, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [0.007, 0.445, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  //draw square
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.56, 0.75, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree0 + 45), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
  pushMatrix(matrixStack, mMatrix);
  // color = [0.988, 0.8705, 0, 1];
  mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [0.007, 0.445, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  //draw square
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.56, 0.75, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree0 + 90), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [0.007, 0.445, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  //draw square
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.56, 0.75, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree0 + 135), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [0.007, 0.445, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  //draw square
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.56, 0.75, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree0 + 180), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [0.007, 0.445, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  //draw circle
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.56, 0.75, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [0, 0, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.14, 0.14, 1]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);
}

function car() {
  mat4.identity(mMatrix);
  color = [0, 0, 0, 1];
  mMatrix = mat4.translate(mMatrix, [-0.52, -0.89, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.05, 0.05]);
  drawCircle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [5, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  drawCircle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0.427, 0.427, 0.427, 1];
  mMatrix = mat4.translate(mMatrix, [-0.52, -0.89, 0]);
  mMatrix = mat4.scale(mMatrix, [0.04, 0.04, 0.04]);
  drawCircle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [6.25, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  drawCircle(color, mMatrix);
  // return;

  
  mat4.identity(mMatrix);
  color = [0.7411, 0.3294, 0.2352, 1];
  mMatrix = mat4.scale(mMatrix, [0.24, 0.16, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-1.66, -4.6, 0]);
  drawSquare(color, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.6, 1, 1.0]);
  drawTriangle(color, mMatrix);

  mMatrix = mat4.translate(mMatrix, [-1.67, 0.0, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0.4235, 0.847, 1];
  mMatrix = mat4.translate(mMatrix, [-0.4, -0.8, 0]);
  mMatrix = mat4.scale(mMatrix, [0.4, 0.12, 1.0]);
  drawSquare(color, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0.5, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.4, 1, 1.0]);
  drawTriangle(color, mMatrix);

  mMatrix = mat4.translate(mMatrix, [-2.52, 0.0, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1.0]);
  drawTriangle(color, mMatrix);
}

function mill() {
  degree1 -= 2;
  mat4.identity(mMatrix);
  color = [0.1569, 0.1569, 0.1733, 1];
  mMatrix = mat4.translate(mMatrix, [0.65, -0.08, 0]);
  mMatrix = mat4.scale(mMatrix, [0.03, 0.55, 1.0]);
  drawSquare(color, mMatrix);

  color = [0.647, 0.647, 0, 1];

  mat4.identity(mMatrix);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.65, 0.2, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.65, -0.115, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.65, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.65, 0.2, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1 + 90), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.65, -0.115, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.65, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.65, 0.2, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1 + 180), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.65, -0.115, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.65, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.65, 0.2, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1 + 270), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-0.65, -0.115, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.65, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  // mat4.identity(mMatrix);
  // color = [0.647, 0.647, 0, 1];
  // mMatrix = mat4.translate(mMatrix, [0.65, 0.09, 0]);
  // mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  // drawTriangle(color, mMatrix);

  // mMatrix = mat4.translate(mMatrix, [0, 0.9, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  // drawTriangle(color, mMatrix);

  // mat4.identity(mMatrix);
  // mMatrix = mat4.translate(mMatrix, [0.75, 0.2, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(90), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  // drawTriangle(color, mMatrix);

  // mMatrix = mat4.translate(mMatrix, [0, 0.9, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  // drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0.1529, 0.1529, 0.1733, 1];
  mMatrix = mat4.translate(mMatrix, [-0.5, -0.1, 0]);
  mMatrix = mat4.scale(mMatrix, [0.03, 0.55, 1.0]);
  drawSquare(color, mMatrix);

  color = [0.647, 0.647, 0, 1];

  mat4.identity(mMatrix);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.17, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [0.5, -0.115, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  mat4.identity(mMatrix);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.17, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1 + 90), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [0.5, -0.115, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  mat4.identity(mMatrix);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.17, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1 + 180), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [0.5, -0.115, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  mat4.identity(mMatrix);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.17, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1 + 270), [0.0, 0.0, 1.0]);
  mMatrix = mat4.translate(mMatrix, [0.5, -0.115, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  // mat4.identity(mMatrix);
  // color = [0.647, 0.647, 0, 1];

  // mMatrix = mat4.translate(mMatrix, [-0.5, 0.068, 0]);
  // // mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  // drawTriangle(color, mMatrix);

  // mMatrix = mat4.translate(mMatrix, [0, 0.9, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  // drawTriangle(color, mMatrix);

  // mat4.identity(mMatrix);

  // mMatrix = mat4.translate(mMatrix, [-0.4, 0.175, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(90), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [0.05, 0.23, 1.0]);
  // drawTriangle(color, mMatrix);

  // mMatrix = mat4.translate(mMatrix, [0, 0.9, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  // drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0, 0, 1];
  mMatrix = mat4.translate(mMatrix, [0.65, 0.2, 0]);
  mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 0.03]);
  drawCircle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-38.3, -0.9, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  drawCircle(color, mMatrix);
}

function boat() {
  if (x < -1) change = 0.003;
  if (x > 0.38) change = -0.003;
  x += change;
  mat4.identity(mMatrix);
  color = [0, 0, 0, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [x, 0.14, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.33, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.015, 0.34, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  mat4.identity(mMatrix);
  color = [0, 0, 0, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [x, 0, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.25, 0.13, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(-30), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.005, 0.34, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  mat4.identity(mMatrix);
  color = [0.8622, 0.8622, 0.8622, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [x, 0, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.32, -0.03, 0]);
  mMatrix = mat4.scale(mMatrix, [0.25, 0.065, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  mat4.identity(mMatrix);
  color = [0.8622, 0.8622, 0.8622, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [x, 0, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.193, -0.03, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.1, 0.065, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [x, 0, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.447, -0.03, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.1, 0.065, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  mat4.identity(mMatrix);
  color = [0.96, 0.2578, 0, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [x, 0, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.455, 0.16, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(-90), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.23, 0.23, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack); //

  // mat4.identity(mMatrix);
  // color = [0, 0, 0, 1];
  // mMatrix = mat4.translate(mMatrix, [0.4, 0.14, 0]);
  // mMatrix = mat4.scale(mMatrix, [0.015, 0.34, 1.0]);
  // drawSquare(color, mMatrix);

  // mat4.identity(mMatrix);
  // color = [0, 0, 0, 1];
  // mMatrix = mat4.translate(mMatrix, [0.32, 0.14, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(-30), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [0.005, 0.34, 1.0]);
  // drawSquare(color, mMatrix);

  // mat4.identity(mMatrix);
  // color = [0.8622, 0.8622, 0.8622, 1];
  // mMatrix = mat4.translate(mMatrix, [0.4, -0.03, 0]);
  // mMatrix = mat4.scale(mMatrix, [0.25, 0.065, 1.0]);
  // drawSquare(color, mMatrix);

  // mat4.identity(mMatrix);

  // mMatrix = mat4.translate(mMatrix, [0.275, -0.03, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [0.1, 0.065, 1.0]);
  // drawTriangle(color, mMatrix);

  // mMatrix = mat4.translate(mMatrix, [-2.5, 0.0, 0]);
  // mMatrix = mat4.scale(mMatrix, [1, 1, 1.0]);
  // drawTriangle(color, mMatrix);//

  // mat4.identity(mMatrix);
  // color = [0.96, 0.2578, 0, 1];
  // mMatrix = mat4.translate(mMatrix, [0.522, 0.16, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(-90), [0, 0, 1]);
  // mMatrix = mat4.scale(mMatrix, [0.23, 0.23, 1.0]);
  // drawTriangle(color, mMatrix);
}

function tree() {
  mat4.identity(mMatrix);
  color = [0.4756, 0.2622, 0.23556, 1];
  mMatrix = mat4.scale(mMatrix, [0.05, 0.3, 1.0]);
  mMatrix = mat4.translate(mMatrix, [17, 0.86, 0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0.5956, 0.2667, 1];
  mMatrix = mat4.translate(mMatrix, [0.85, 0.53, 0]);
  mMatrix = mat4.scale(mMatrix, [0.41, 0.28, 1.0]);
  drawTriangle(color, mMatrix);

  color = [0.2667, 0.7244, 0.2667, 1];
  mMatrix = mat4.translate(mMatrix, [0, 0.2, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1.0]);
  drawTriangle(color, mMatrix);

  color = [0.382, 0.848, 0.2755, 1];
  mMatrix = mat4.translate(mMatrix, [0, 0.2, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0.4756, 0.2622, 0.23556, 1];
  mMatrix = mat4.scale(mMatrix, [0.05, 0.4, 1.0]);
  mMatrix = mat4.translate(mMatrix, [10, 0.78, 0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0.5956, 0.2667, 1];
  mMatrix = mat4.translate(mMatrix, [0.5, 0.61, 0]);
  mMatrix = mat4.scale(mMatrix, [0.51, 0.35, 1.0]);
  drawTriangle(color, mMatrix);

  color = [0.2667, 0.7244, 0.2667, 1];
  mMatrix = mat4.translate(mMatrix, [0, 0.2, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  drawTriangle(color, mMatrix);

  color = [0.382, 0.848, 0.2755, 1];
  mMatrix = mat4.translate(mMatrix, [0, 0.2, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0.4756, 0.2622, 0.23556, 1];
  mMatrix = mat4.scale(mMatrix, [0.045, 0.3, 1.0]);
  mMatrix = mat4.translate(mMatrix, [4.5, 0.86, 0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0.5956, 0.2667, 1];
  mMatrix = mat4.translate(mMatrix, [0.2, 0.51, 0]);
  mMatrix = mat4.scale(mMatrix, [0.328, 0.224, 1.0]);
  drawTriangle(color, mMatrix);

  color = [0.2667, 0.7244, 0.2667, 1];
  mMatrix = mat4.translate(mMatrix, [0, 0.2, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1.0]);
  drawTriangle(color, mMatrix);
  color = [0.382, 0.848, 0.2755, 1];
  mMatrix = mat4.translate(mMatrix, [0, 0.2, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 1, 1.0]);
  drawTriangle(color, mMatrix);
}

function mountain() {
  mat4.identity(mMatrix);
  color = [0.4978, 0.311, 0.2088, 1];
  mMatrix = mat4.translate(mMatrix, [-0.797, 0.149, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 0.4, 1.0]);
  // local scale operation for the circle
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0.6044, 0.44, 0.2844, 1];
  mMatrix = mat4.translate(mMatrix, [-0.692, 0.15, 0]);
  mMatrix = mat4.scale(mMatrix, [1.2, 0.4, 1.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  // local scale operation for the circle
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0.4978, 0.311, 0.2088, 1];
  mMatrix = mat4.translate(mMatrix, [0.007, 0.267, 0]);
  mMatrix = mat4.scale(mMatrix, [1.3, 0.4, 1.0]);
  // local scale operation for the circle
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0.6044, 0.44, 0.2844, 1];
  mMatrix = mat4.translate(mMatrix, [0.1, 0.27, 0]);
  mMatrix = mat4.scale(mMatrix, [1.1, 0.4, 1.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  // local scale operation for the circle
  drawTriangle(color, mMatrix);

  mMatrix = mat4.rotate(mMatrix, degToRad(-10), [0, 0, 1]);
  mMatrix = mat4.translate(mMatrix, [0.7, -0.2, 0]);
  mMatrix = mat4.scale(mMatrix, [1, 0.7, 1.0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  // local scale operation for the circle
  drawTriangle(color, mMatrix);

  // mMatrix = mat4.translate(mMatrix, [0.5, -0.1, 0]);
  // mMatrix = mat4.scale(mMatrix, [1, 0.4, 1.0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(-10), [0, 0, 1]);
  // // local scale operation for the circle
  // drawTriangle(color, mMatrix);
}

function river() {
  mat4.identity(mMatrix);
  color = [0, 0.3176, 0.9607, 1];
  // local rotation operation for the square
  // mMatrix = mat4.rotate(mMatrix, degToRad(20), [0, 0, 1]);
  // local scale operation for the square
  mMatrix = mat4.scale(mMatrix, [2, 0.27, 1.0]);
  mMatrix = mat4.translate(mMatrix, [0, -0.2, 0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  color = [1, 1, 1, 1];
  // local rotation operation for the square
  // mMatrix = mat4.rotate(mMatrix, degToRad(20), [0, 0, 1]);
  // local scale operation for the square
  mMatrix = mat4.scale(mMatrix, [0.45, 0.003, 1.0]);
  mMatrix = mat4.translate(mMatrix, [-1.3, -10, 0]);
  drawSquare(color, mMatrix);

  mMatrix = mat4.scale(mMatrix, [0.9, 0.7, 1]);
  mMatrix = mat4.translate(mMatrix, [1.7, 25, 0]);
  drawSquare(color, mMatrix);

  mMatrix = mat4.scale(mMatrix, [0.9, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [1.5, -70, 0]);
  drawSquare(color, mMatrix);
}

function bird() {
  mat4.identity(mMatrix);
  color = [0, 0, 0, 1];
  mMatrix = mat4.translate(mMatrix, [-0.2, 0.85, 0]);
  mMatrix = mat4.scale(mMatrix, [0.01, 0.01, 1.0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.18, 0.86, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.06, 0.01, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.221, 0.86, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(-10), [0, 0, 1]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.06, 0.01, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0, 0, 1];
  mMatrix = mat4.translate(mMatrix, [0.3, 0.9, 0]);
  mMatrix = mat4.scale(mMatrix, [0.01, 0.01, 1.0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.322, 0.91, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.06, 0.01, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.277, 0.91, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(-10), [0, 0, 1]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.06, 0.01, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0, 0, 1];
  mMatrix = mat4.translate(mMatrix, [0.12, 0.8, 0]);
  mMatrix = mat4.scale(mMatrix, [0.017, 0.017, 1.0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.165, 0.826, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.1, 0.02, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.076, 0.826, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(-10), [0, 0, 1]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.1, 0.02, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0, 0, 1];
  mMatrix = mat4.translate(mMatrix, [-0.01, 0.88, 0]);
  mMatrix = mat4.scale(mMatrix, [0.01, 0.01, 1.0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.011, 0.89, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.06, 0.01, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.031, 0.89, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(-10), [0, 0, 1]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.06, 0.01, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0, 0, 1];
  mMatrix = mat4.translate(mMatrix, [0.08, 0.93, 0]);
  mMatrix = mat4.scale(mMatrix, [0.005, 0.005, 1.0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.09, 0.935, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.03, 0.005, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.07, 0.935, 0]);

  mMatrix = mat4.rotate(mMatrix, degToRad(-10), [0, 0, 1]);
  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [0.03, 0.005, 1.0]);
  drawTriangle(color, mMatrix);
}

function ground() {
  mat4.identity(mMatrix);
  color = [0, 0.8627, 0.4392, 1];
  mMatrix = mat4.scale(mMatrix, [2, 1.2, 1.0]);
  mMatrix = mat4.translate(mMatrix, [0, -0.4, 0]);
  drawSquare(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0.333, 0.6392, 0.149, 1];
  mMatrix = mat4.translate(mMatrix, [0.5, -0.7, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(50), [0, 0, 1]);

  // local scale operation for the circle
  mMatrix = mat4.scale(mMatrix, [2, 1.8, 1.0]);
  drawTriangle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0.3254, 0, 1];
  mMatrix = mat4.scale(mMatrix, [0.06, 0.05, 1]);
  mMatrix = mat4.translate(mMatrix, [0.6, -11, 0]);
  drawCircle(color, mMatrix);

  color = [0, 0.6392, 0, 1];
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [-4, 0, 0]);
  drawCircle(color, mMatrix);

  color = [0, 0.5215, 0, 1];
  mMatrix = mat4.scale(mMatrix, [2, 1.5, 1]);
  mMatrix = mat4.translate(mMatrix, [1, 0, 0]);
  drawCircle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0.6392, 0, 1];
  mMatrix = mat4.scale(mMatrix, [0.08, 0.07, 1]);
  mMatrix = mat4.translate(mMatrix, [10.5, -4.5, 0]);
  drawCircle(color, mMatrix);

  color = [0, 0.5215, 0, 1];
  mMatrix = mat4.scale(mMatrix, [2, 1.5, 1]);
  mMatrix = mat4.translate(mMatrix, [1.2, 0, 0]);
  drawCircle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0.3254, 0, 1];
  mMatrix = mat4.scale(mMatrix, [0.05, 0.04, 1]);
  mMatrix = mat4.translate(mMatrix, [-15.5, -14, 0]);
  drawCircle(color, mMatrix);

  color = [0, 0.6392, 0, 1];
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [-4, 0, 0]);
  drawCircle(color, mMatrix);

  color = [0, 0.5215, 0, 1];
  mMatrix = mat4.scale(mMatrix, [2, 1.5, 1]);
  mMatrix = mat4.translate(mMatrix, [1, 0, 0]);
  drawCircle(color, mMatrix);
  
  // mat4.identity(mMatrix);//
  // color = [0, 0.6392, 0, 1];
  // mMatrix = mat4.scale(mMatrix, [0.07, 0.06, 1]);
  // mMatrix = mat4.translate(mMatrix, [-14, -9, 0]);
  // drawCircle(color, mMatrix);

  // color = [0, 0.5215, 0, 1];
  // mMatrix = mat4.scale(mMatrix, [1.6, 1.2, 1]);
  // mMatrix = mat4.translate(mMatrix, [1.2, 0, 0]);
  // drawCircle(color, mMatrix);

  mat4.identity(mMatrix);
  color = [0, 0.3254, 0, 1];
  mMatrix = mat4.scale(mMatrix, [0.09, 0.07, 1]);
  mMatrix = mat4.translate(mMatrix, [2, -14.8, 0]);
  drawCircle(color, mMatrix);

  color = [0, 0.6392, 0, 1];
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [-4, 0, 0]);
  drawCircle(color, mMatrix);

  color = [0, 0.5215, 0, 1];
  mMatrix = mat4.scale(mMatrix, [2, 1.5, 1]);
  mMatrix = mat4.translate(mMatrix, [1, 0, 0]);
  drawCircle(color, mMatrix);
}

function sky() {
  mat4.identity(mMatrix);
  color = [0.3372, 0.7568, 0.9803, 1.0];
  mMatrix = mat4.scale(mMatrix, [2, 1.4, 1]);
  mMatrix = mat4.translate(mMatrix, [0, 0.6, 0]);
  drawSquare(color, mMatrix);
  mat4.identity(mMatrix);
  color = [1, 1, 1, 1];
  mMatrix = mat4.scale(mMatrix, [0.22, 0.13, 1]);
  mMatrix = mat4.translate(mMatrix, [-4, 3.7, 0]);
  drawCircle(color, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.7, 0.7, 1]);
  mMatrix = mat4.translate(mMatrix, [1.5, -0.5, 0]);
  drawCircle(color, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.7, 0.7, 1]);
  mMatrix = mat4.translate(mMatrix, [1.5, -0.2, 0]);
  drawCircle(color, mMatrix);
}

function start(change) {
  index = change;
}
function drawScene() {
  if (animation) {
    window.cancelAnimationFrame(animation);
  }

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  var animate = function () {

    gl.clearColor(1, 1, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    sky();
    sun();
    mountain();
    bird();
    ground();
    tree();
    river();
    boat();
    mill();
    house();
    car();
    animation = window.requestAnimationFrame(animate);
  };

  animate();
}

// This is the entry point from the html
function webGLStart() {
  var canvas = document.getElementById("assignment_1");
  initGL(canvas);
  shaderProgram = initShaders();

  //get locations of attributes declared in the vertex shader
  const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);

  uColorLoc = gl.getUniformLocation(shaderProgram, "color");

  initSquareBuffer();
  initTriangleBuffer();
  initCircleBuffer();

  drawScene();
}
