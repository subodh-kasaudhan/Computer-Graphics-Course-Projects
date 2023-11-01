////////////////////////////////////////////////////////////////////////
//  A simple WebGL program to draw a 3D cube with basic interaction.
//
var gl;
var canvas;
var buf;
var indexBuf;
var aPositionLocation1;
var uColorLocation1;
var uPMatrixLocation1;
var uMMatrixLocation1;
var uVMatrixLocation1;
var uLightLocation1;

var aPositionLocation2;
var uColorLocation2;
var uPMatrixLocation2;
var uMMatrixLocation2;
var uVMatrixLocation2;
var uLightLocation2;

var aPositionLocation3;
var uColorLocation3;
var uPMatrixLocation3;
var uMMatrixLocation3;
var uVMatrixLocation3;
var uLightLocation3;
var aNormalLocation1; //
var aNormalLocation2; //
var aNormalLocation3; //
var uNMatrixLocation1; //
var uNMatrixLocation2; //
var uNMatrixLocation3; //

//for ViewPort 1
var degreex2 = 0.0;
var degreex1 = 0.0;
var degreex0 = 0.0;
var prevMouseX1 = 0.0;
var prevMouseY1 = 0.0;
var prevMouseZ1 = 0.0;

//for ViewPort 2
var degreey2 = 0.0;
var degreey1 = 0.0;
var degreey0 = 0.0;
var prevMouseX2 = 0.0;
var prevMouseY2 = 0.0;
var prevMouseZ2 = 0.0;

//for ViewPort 3
var degreez2 = 0.0;
var degreez1 = 0.0;
var degreez0 = 0.0;
var prevMouseX3 = 0.0;
var prevMouseY3 = 0.0;
var prevMouseZ3 = 0.0;

//for Light Position
var uLite = 10.0;

//for camera location
var CamDis = 2.0;

// initialize model, view, and projection matrices
var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); //projection matrix
var nMatrix = mat4.create();

// specify camera/eye coordinate system parameters
var eyePos = [0.0, 0.0, 2.0];
var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

/////Vertex shader code/////
const vertexShaderCode1 = `#version 300 es
///////start
in vec3 aPosition;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;



out vec4 posInEyeSpace;
void main() {
  mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;
  gl_Position = projectionModelView*vec4(aPosition,1.0);
  posInEyeSpace = uVMatrix*uMMatrix*vec4(aPosition,1.0);
  gl_PointSize=5.0;
}`;

const fragShaderCode1 = `#version 300 es
precision mediump float;

in vec4 posInEyeSpace; //


out vec4 fragColor;
uniform vec4 objColor;
uniform float uLite;

void main() {
  float alpha = 5.0;
  float ulite = uLite;
  vec3 lightPos = vec3(ulite, 20, 20); 
  vec3 normal = normalize(cross(dFdx(posInEyeSpace.xyz), dFdy(posInEyeSpace.xyz)));
  vec3 L = normalize(lightPos - posInEyeSpace.xyz);
  vec3 R = normalize(-reflect(L, normal));
  vec3 V = normalize(-vec3(posInEyeSpace));
  vec3 light_spec=(pow(max(dot(V,R),0.0),26.0))*vec3(1.0,1.0,1.0);
  vec3 light_ambient=0.4*(vec3(objColor));
  vec3 light_diffused=max(dot(normal,L),0.0)*vec3(objColor);
  fragColor=vec4(light_diffused+light_ambient+light_spec,1.0);
}`;

////Per Vertex Shading Code////
const vertexShaderCode2 = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uNMatrix;

uniform vec4 objColor;
out vec4 posInEyeSpace;
out vec4 vertColor;
uniform float uLite;

void main() {  
  float ulite = uLite;
  vec3 lightPos = vec3(ulite, 20, 20);

  mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;
  gl_Position = projectionModelView*vec4(aPosition,1.0);
  posInEyeSpace = uVMatrix*uMMatrix*vec4(aPosition,1.0);
  gl_PointSize=5.0;

  vec3 normal = normalize(vec3(uNMatrix * vec4(aNormal, 0.0)));

  vec3 L = normalize(lightPos - posInEyeSpace.xyz);
  vec3 R = normalize(-reflect(L, normal));
  vec3 V = normalize(-vec3(posInEyeSpace));

  
  float alpha = 40.0;
  vec3 light_spec=(pow(max(dot(V,R),0.0),26.0))*vec3(1.0,1.0,1.0);
  vec3 light_ambient=0.4*(vec3(objColor));
  vec3 light_diffused=max(dot(normal,L),0.0)*vec3(objColor);
  vertColor=vec4(light_diffused+light_ambient+light_spec,1.0);
}`;

const fragShaderCode2 = `#version 300 es
precision mediump float;

in vec4 vertColor;

out vec4 fragColor;

void main() {
  fragColor = vertColor;
}`;

////Per Fragment Shading Code////
const vertexShaderCode3 = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uNMatrix;

uniform vec4 objColor;
out vec4 posInEyeSpace;
// out vec4 vertColor;
out vec3 normal;

void main() {  

  mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;
  gl_Position = projectionModelView*vec4(aPosition,1.0);
  posInEyeSpace = uVMatrix*uMMatrix*vec4(aPosition,1.0);
  gl_PointSize=5.0;

  normal = normalize(vec3(uNMatrix * vec4(aNormal, 0.0)));
  
}`;

// Fragment shader code
const fragShaderCode3 = `#version 300 es
precision mediump float;

uniform vec4 objColor;
in vec4 posInEyeSpace;
in vec3 normal;

out vec4 fragColor;

uniform float uLite;

void main() {
  float ulite = uLite;
  vec3 lightPos = vec3(ulite, 20, 20);
  
  vec3 L = normalize(lightPos - posInEyeSpace.xyz);
  vec3 R = normalize(-reflect(L, normal));
  vec3 V = normalize(-vec3(posInEyeSpace.xyz));
  vec3 light_spec=(pow(max(dot(V,R),0.0),26.0))*vec3(1.0,1.0,1.0);
  vec3 light_ambient=0.4*(vec3(objColor));
  vec3 light_diffused=max(dot(normal,L),0.0)*vec3(objColor);
  vec4 vertColor=vec4(light_diffused+light_ambient+light_spec,1.0);
  fragColor = vertColor;
}`;

////////////

var spBuf;
var spIndexBuf;
var spNormalBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];

// New sphere initialization function
function initSphere(nslices, nstacks, radius) {
  for (var i = 0; i <= nslices; i++) {
    var angle = (i * Math.PI) / nslices;
    var comp1 = Math.sin(angle);
    var comp2 = Math.cos(angle);

    for (var j = 0; j <= nstacks; j++) {
      var phi = (j * 2 * Math.PI) / nstacks;
      var comp3 = Math.sin(phi);
      var comp4 = Math.cos(phi);

      var xcood = comp4 * comp1;
      var ycoord = comp2;
      var zcoord = comp3 * comp1;

      spVerts.push(radius * xcood, radius * ycoord, radius * zcoord);
      spNormals.push(xcood, ycoord, zcoord);
    }
  }

  // now compute the indices here
  for (var i = 0; i < nslices; i++) {
    for (var j = 0; j < nstacks; j++) {
      var id1 = i * (nstacks + 1) + j;
      var id2 = id1 + nstacks + 1;

      spIndicies.push(id1, id2, id1 + 1);
      spIndicies.push(id2, id2 + 1, id1 + 1);
    }
  }
}

function initSphereBuffer() {
  var nslices = 30;
  var nstacks = 30;
  var radius = 1.0;

  initSphere(nslices, nstacks, radius);

  // buffer for vertices
  spBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
  spBuf.itemSize = 3;
  spBuf.numItems = spVerts.length / 3;

  // buffer for indices
  spIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(spIndicies),
    gl.STATIC_DRAW
  );
  spIndexBuf.itemsize = 1;
  spIndexBuf.numItems = spIndicies.length;

  // buffer for normals
  spNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
  spNormalBuf.itemSize = 3;
  spNormalBuf.numItems = spNormals.length / 3;
}

function drawSphere1(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.vertexAttribPointer(
    aPositionLocation1,
    spBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation1,
    spNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.uniform4fv(uColorLocation1, color);
  gl.uniformMatrix4fv(uMMatrixLocation1, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation1, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation1, false, pMatrix);
  gl.uniformMatrix4fv(uNMatrixLocation1, false, nMatrix);
  gl.uniform1f(uLightLocation1, uLite);

  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
  // gl.drawArrays(gl.LINE_STRIP, 0, spBuf.numItems); // show lines
  // gl.drawArrays(gl.POINTS, 0, spBuf.numItems); // show points
}

function drawSphere2(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.vertexAttribPointer(
    aPositionLocation2,
    spBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation2,
    spNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.uniform4fv(uColorLocation2, color);
  gl.uniformMatrix4fv(uMMatrixLocation2, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation2, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation2, false, pMatrix);
  gl.uniformMatrix4fv(uNMatrixLocation2, false, nMatrix);
  gl.uniform1f(uLightLocation2, uLite);

  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
  // gl.drawArrays(gl.LINE_STRIP, 0, spBuf.numItems); // show lines
  // gl.drawArrays(gl.POINTS, 0, spBuf.numItems); // show points
}

function drawSphere3(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.vertexAttribPointer(
    aPositionLocation3,
    spBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation3,
    spNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.uniform4fv(uColorLocation3, color);
  gl.uniformMatrix4fv(uMMatrixLocation3, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation3, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation3, false, pMatrix);
  gl.uniformMatrix4fv(uNMatrixLocation3, false, nMatrix);
  gl.uniform1f(uLightLocation3, uLite);

  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
  // gl.drawArrays(gl.LINE_STRIP, 0, spBuf.numItems); // show lines
  // gl.drawArrays(gl.POINTS, 0, spBuf.numItems); // show points
}

/////////////

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

function initShaders(vertexShaderCode, fragShaderCode) {
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

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function initCubeBuffer() {
  var vertices = [
    // Front face
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Back face
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    // Top face
    -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Bottom face
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
    // Right face
    0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
    // Left face
    -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5,
  ];
  buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  buf.itemSize = 3;
  buf.numItems = vertices.length / 3;

  var normals = [
    // Front face
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    // Back face
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    // Top face
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    // Bottom face
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
    // Right face
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    // Left face
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ];
  cubeNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  cubeNormalBuf.itemSize = 3;
  cubeNormalBuf.numItems = normals.length / 3;

  var indices = [
    0,
    1,
    2,
    0,
    2,
    3, // Front face
    4,
    5,
    6,
    4,
    6,
    7, // Back face
    8,
    9,
    10,
    8,
    10,
    11, // Top face
    12,
    13,
    14,
    12,
    14,
    15, // Bottom face
    16,
    17,
    18,
    16,
    18,
    19, // Right face
    20,
    21,
    22,
    20,
    22,
    23, // Left face
  ];
  indexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  indexBuf.itemSize = 1;
  indexBuf.numItems = indices.length;
}

function drawCube1(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(
    aPositionLocation1,
    buf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation1,
    cubeNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.uniform4fv(uColorLocation1, color);
  gl.uniformMatrix4fv(uMMatrixLocation1, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation1, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation1, false, pMatrix);
  gl.uniformMatrix4fv(uNMatrixLocation1, false, nMatrix);
  gl.uniform1f(uLightLocation1, uLite);

  gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
  //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}

function drawCube2(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(
    aPositionLocation2,
    buf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation2,
    cubeNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.uniform4fv(uColorLocation2, color);
  gl.uniformMatrix4fv(uMMatrixLocation2, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation2, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation2, false, pMatrix);
  gl.uniformMatrix4fv(uNMatrixLocation2, false, nMatrix);
  gl.uniform1f(uLightLocation2, uLite);

  gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
  //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}

function drawCube3(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(
    aPositionLocation3,
    buf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation3,
    cubeNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.uniform4fv(uColorLocation3, color);
  gl.uniformMatrix4fv(uMMatrixLocation3, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation3, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation3, false, pMatrix);
  gl.uniformMatrix4fv(uNMatrixLocation3, false, nMatrix);
  gl.uniform1f(uLightLocation3, uLite);

  gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
  //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}

//////////////////////////////////////////////////////////////////////
//Main drawing routine
function viewport1() {
  mat4.identity(vMatrix);
  vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);

  //set up perspective projection matrix
  mat4.identity(pMatrix);
  mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

  //set up the model matrix
  mat4.identity(mMatrix);

  // transformations applied here on model matrix
  mMatrix = mat4.rotate(mMatrix, degToRad(25 + degreex0), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(10 + degreex1), [1, 0, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(5), [0, 0, 1]);

  mMatrix = mat4.scale(mMatrix, [0.45, 0.63, 0.45]);
  mMatrix = mat4.translate(mMatrix, [0, -0.14, 0]);
  var color = [0.403, 0.403, 0.239, 1]; // specify color for the cube
  // drawCube(color);
  // mMatrix = mat4.scale(mMatrix, [1.5, 2.5, 1.5]);
  // mMatrix = mat4.translate(mMatrix, [0, -0.9, 0]);
  // color = [0.2, 0.2, 0.0, 1];
  drawCube1(color);
  // mat4.identity(vMatrix);
  // vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);

  // //set up perspective projection matrix
  // mat4.identity(pMatrix);
  // mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

  // //set up the model matrix
  // mat4.identity(mMatrix);

  // // transformations applied here on model matrix
  // mMatrix = mat4.rotate(mMatrix, degToRad(20 + degreex0), [0, 1, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(15 + degreex1), [1, 0, 0]);

  mMatrix = mat4.scale(mMatrix, [0.525, 0.375, 0.525]);
  mMatrix = mat4.translate(mMatrix, [0, 2.32, 0]);
  color = [0, 0.341, 0.549, 1]; // specify color for the cube
  drawSphere1(color);
  // mMatrix = mat4.scale(mMatrix, [1.5, 2.5, 1.5]);
  // mMatrix = mat4.translate(mMatrix, [0, -0.9, 0]);
  // color = [0.2, 0.2, 0.0, 1];
  // drawCube(color);
}

function viewport2() {
  mat4.identity(vMatrix);
  vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);

  //set up perspective projection matrix
  mat4.identity(pMatrix);
  mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

  //set up the model matrix
  mat4.identity(mMatrix);

  // transformations applied here on model matrix
  mMatrix = mat4.rotate(mMatrix, degToRad(degreey0 - 15), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degreey1 + 10), [1, 0, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(-30), [0, 0, 1]);

  mMatrix = mat4.scale(mMatrix, [0.35, 0.35, 0.35]);
  mMatrix = mat4.translate(mMatrix, [-0.68, -0.5, -0.1]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  color = [0, 0.407, 0, 1]; // specify color for the cube
  drawCube2(color);

  mMatrix = mat4.scale(mMatrix, [0.6, 0.6, 0.6]);
  mMatrix = mat4.translate(mMatrix, [0.73, 3, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(+15), [0, 1, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(degreey1 -10), [1, 0, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(-25), [0, 0, 1]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawCube2(color);

  // transformations applied here on model matrix
  mMatrix = mat4.rotate(mMatrix, degToRad(-5), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(-10), [1, 0, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(+50), [0, 0, 1]);

  mMatrix = mat4.scale(mMatrix, [1.35, 1.35, 1.35]);
  mMatrix = mat4.translate(mMatrix, [0, -2.4, 0]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  var color = [0.458, 0.458, 0.458, 1]; // specify color for the cube
  drawSphere2(color);

  mMatrix = mat4.scale(mMatrix, [0.7, 0.7, 0.7]);
  mMatrix = mat4.translate(mMatrix, [-1.2, 2.5, 0]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawSphere2(color);

  mMatrix = mat4.scale(mMatrix, [0.4, 0.4, 0.4]);
  mMatrix = mat4.translate(mMatrix, [1.6, 4.2, 0.2]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawSphere2(color);
}

function viewport3() {
  mat4.identity(vMatrix);
  vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);

  //set up perspective projection matrix
  mat4.identity(pMatrix);
  mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

  //set up the model matrix
  mat4.identity(mMatrix);

  // transformations applied here on model matrix
  mMatrix = mat4.rotate(mMatrix, degToRad(degreez1 + 8), [1, 0, 0]);

  // mMatrix = mat4.rotate(mMatrix, degToRad(degreez2), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.18, 0.18, 0.18]);
  mMatrix = mat4.translate(mMatrix, [-0.0, -2, -0.5]);
  var color = [0.0, 0.576, 0.031, 1]; // specify color for the cube
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawSphere3(color);

  color = [0.376, 0.376, 0.513, 1];
  mMatrix = mat4.translate(mMatrix, [0, 5.2, 0]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawSphere3(color);

  mMatrix = mat4.rotate(mMatrix, degToRad(degreez0 + 30), [0, 1, 0]);

  color = [0.219, 0.219, 0.549, 1];
  mMatrix = mat4.scale(mMatrix, [0.7, 0.7, 0.7]);
  mMatrix = mat4.translate(mMatrix, [-4.2, -4.78, 0.2]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawSphere3(color);

  color = [0.0509, 0.341, 0.411, 1];
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [8, 0, 0]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawSphere3(color);

  color = [0.45, 0.286, 0.027, 1];
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [0, 2.2, 0]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawSphere3(color);

  color = [0.56, 0.0, 0.56, 1];
  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [-8, 0, 0]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawSphere3(color);

  mMatrix = mat4.scale(mMatrix, [10, 0.2, 2]);
  mMatrix = mat4.translate(mMatrix, [0.41, 5.4, 0]);
  color = [0.6, 0.165, 0.015, 1]; // specify color for the cube
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawCube3(color);

  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [0.0, -22, 0]);
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawCube3(color);

  mMatrix = mat4.scale(mMatrix, [0.2, 1, 4]);
  mMatrix = mat4.translate(mMatrix, [2.05, 11, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(+10), [0, 1, 0]);

  color = [0.0705, 0.521, 0.38, 1]; // specify color for the cube
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawCube3(color);

  mMatrix = mat4.scale(mMatrix, [1, 1, 1]);
  mMatrix = mat4.translate(mMatrix, [-4.1, 0, 0]);
  // mMatrix = mat4.rotate(mMatrix, degToRad(+10), [1, 0, 0]);

  color = [0.5411, 0.5411, 0.0, 1]; // specify color for the cube
  nMatrix = mat4.transpose(
    mat4.inverse(mat4.multiply(mMatrix, vMatrix, nMatrix))
  );
  drawCube3(color);
}

function drawScene() {
  // Lower left viewport area
  gl.enable(gl.SCISSOR_TEST);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(shaderProgram2);
  gl.viewport(500, 0, 400, 400);
  gl.scissor(500, 0, 1000, 1000);
  gl.clearColor(0.874, 0.768, 0.756, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // gl.drawArrays(gl.TRIANGLES, 0, 3);
  viewport2();

  gl.useProgram(shaderProgram1);
  gl.viewport(0, 0, 370, 370);
  gl.scissor(0, 0, 500, 1000);
  gl.clearColor(0.78, 0.78, 0.886, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  viewport1();

  gl.useProgram(shaderProgram3);
  gl.viewport(1050, 0, 400, 400);
  gl.scissor(1000, 0, 1500, 1000);
  gl.clearColor(0.792, 0.898, 0.792, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // gl.drawArrays(gl.TRIANGLES, 0, 3);
  viewport3();
}

function onMouseDown(event) {
  document.addEventListener("mousemove", onMouseMove, false);
  document.addEventListener("mouseup", onMouseUp, false);
  document.addEventListener("mouseout", onMouseOut, false);

  if (
    event.layerX <= canvas.width / 3 &&
    event.layerX >= 0 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    prevMouseX1 = event.clientX;
    prevMouseY1 = canvas.height - event.clientY;
    prevMouseZ1 = canvas.width - event.clientZ;
  }
  if (
    event.layerX <= (2 * canvas.width) / 3 &&
    event.layerX > canvas.width / 3 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    prevMouseX2 = event.clientX;
    prevMouseY2 = canvas.height - event.clientY;
    prevMouseZ2 = canvas.width - event.clientZ;
  }
  if (
    event.layerX <= canvas.width &&
    event.layerX > (2 * canvas.width) / 3 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    prevMouseX3 = event.clientX;
    prevMouseY3 = canvas.height - event.clientY;
    prevMouseZ3 = canvas.width - event.clientZ;
  }
}

function onMouseMove(event) {
  // make mouse interaction only within canvas
  if (
    event.layerX <= canvas.width / 3 &&
    event.layerX >= 0 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    var mouseX1 = event.clientX;
    var diffX1 = mouseX1 - prevMouseX1;
    prevMouseX1 = mouseX1;
    degreex0 = degreex0 + diffX1 / 5;

    var mouseY1 = canvas.height - event.clientY;
    var diffY1 = mouseY1 - prevMouseY1;
    prevMouseY1 = mouseY1;
    degreex1 = degreex1 - diffY1 / 5;

    // var mouseZ1 = canvas.width - event.clientZ;
    // var diffZ1 = mouseZ1 - prevMouseZ1;
    // prevMouseZ1 = mouseZ1;
    // degreex2 = degreex2 - diffZ1 / 5;
  } else if (
    event.layerX <= (2 * canvas.width) / 3 &&
    event.layerX > canvas.width / 3 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    var mouseX2 = event.clientX;
    var diffX2 = mouseX2 - prevMouseX2;
    prevMouseX2 = mouseX2;
    degreey0 = degreey0 + diffX2 / 5;

    var mouseY2 = canvas.height - event.clientY;
    var diffY2 = mouseY2 - prevMouseY2;
    prevMouseY2 = mouseY2;
    degreey1 = degreey1 - diffY2 / 5;

    // var mouseZ2 = canvas.width - event.clientZ;
    // var diffZ2 = mouseZ2 - prevMouseZ2;
    // prevMouseZ2 = mouseZ2;
    // degreey2 = degreey2 - diffZ2 / 5;
  } else if (
    event.layerX <= canvas.width &&
    event.layerX > (2 * canvas.width) / 3 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    var mouseX3 = event.clientX;
    var diffX3 = mouseX3 - prevMouseX3;
    prevMouseX3 = mouseX3;
    degreez0 = degreez0 + diffX3 / 5;

    var mouseY3 = canvas.height - event.clientY;
    var diffY3 = mouseY3 - prevMouseY3;
    prevMouseY3 = mouseY3;
    degreez1 = degreez1 - diffY3 / 5;

    // var mouseZ3 = canvas.width - event.clientZ;
    // var diffZ3 = mouseZ3 - prevMouseZ3;
    // prevMouseZ3 = mouseZ3;
    // degreez2 = degreez2 - diffZ3 / 5;
  }
  drawScene();
}

function onMouseUp(event) {
  document.removeEventListener("mousemove", onMouseMove, false);
  document.removeEventListener("mouseup", onMouseUp, false);
  document.removeEventListener("mouseout", onMouseOut, false);
}

function onMouseOut(event) {
  document.removeEventListener("mousemove", onMouseMove, false);
  document.removeEventListener("mouseup", onMouseUp, false);
  document.removeEventListener("mouseout", onMouseOut, false);
}

// This is the entry point from the html

// Update the current slider value (each time you drag the slider handle)
// var slider;
// slider.oninput = function () {
//   lite = this.value;
//   console.log(lite);
//   drawScene();
// };

var slider;
function sliderChanged1() {
  uLite = parseFloat(slider.value);
  console.log(uLite);
  drawScene();
}
var ObjSize;
function sliderChanged2() {
  CamDis = parseFloat(ObjSize.value);
  eyePos = [0.0, 0.0, CamDis];
  console.log(CamDis);
  drawScene();
}

function webGLStart() {
  canvas = document.getElementById("simple3DCubeRender");
  document.addEventListener("mousedown", onMouseDown, false);

  slider = document.getElementById("myRange1");
  slider.addEventListener("input", sliderChanged1);
  ObjSize = document.getElementById("myRange2");
  ObjSize.addEventListener("input", sliderChanged2);
  // initialize WebGL
  initGL(canvas);

  // slider = document.getElementById("myRange1");

  // ObjSize = document.getElementById("myRange2");

  // initialize shader program
  shaderProgram1 = initShaders(vertexShaderCode1, fragShaderCode1);
  shaderProgram2 = initShaders(vertexShaderCode2, fragShaderCode2);
  shaderProgram3 = initShaders(vertexShaderCode3, fragShaderCode3);

  //get locations of attributes and uniforms declared in the shader
  aPositionLocation1 = gl.getAttribLocation(shaderProgram1, "aPosition");
  aNormalLocation1 = gl.getAttribLocation(shaderProgram1, "aNormal");
  uMMatrixLocation1 = gl.getUniformLocation(shaderProgram1, "uMMatrix");
  uVMatrixLocation1 = gl.getUniformLocation(shaderProgram1, "uVMatrix");
  uPMatrixLocation1 = gl.getUniformLocation(shaderProgram1, "uPMatrix");
  uNMatrixLocation1 = gl.getUniformLocation(shaderProgram1, "uNMatrix");
  uColorLocation1 = gl.getUniformLocation(shaderProgram1, "objColor");
  uLightLocation1 = gl.getUniformLocation(shaderProgram1, "uLite");

  aPositionLocation2 = gl.getAttribLocation(shaderProgram2, "aPosition");
  aNormalLocation2 = gl.getAttribLocation(shaderProgram2, "aNormal");
  uMMatrixLocation2 = gl.getUniformLocation(shaderProgram2, "uMMatrix");
  uVMatrixLocation2 = gl.getUniformLocation(shaderProgram2, "uVMatrix");
  uPMatrixLocation2 = gl.getUniformLocation(shaderProgram2, "uPMatrix");
  uNMatrixLocation2 = gl.getUniformLocation(shaderProgram2, "uNMatrix");
  uColorLocation2 = gl.getUniformLocation(shaderProgram2, "objColor");
  uLightLocation2 = gl.getUniformLocation(shaderProgram2, "uLite");

  aPositionLocation3 = gl.getAttribLocation(shaderProgram3, "aPosition");
  aNormalLocation3 = gl.getAttribLocation(shaderProgram3, "aNormal");
  uMMatrixLocation3 = gl.getUniformLocation(shaderProgram3, "uMMatrix");
  uVMatrixLocation3 = gl.getUniformLocation(shaderProgram3, "uVMatrix");
  uPMatrixLocation3 = gl.getUniformLocation(shaderProgram3, "uPMatrix");
  uNMatrixLocation3 = gl.getUniformLocation(shaderProgram3, "uNMatrix");
  uColorLocation3 = gl.getUniformLocation(shaderProgram3, "objColor");
  uLightLocation3 = gl.getUniformLocation(shaderProgram3, "uLite");
  //normal  normal matrix

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation1);
  gl.enableVertexAttribArray(aNormalLocation1);
  gl.enableVertexAttribArray(aPositionLocation2);
  gl.enableVertexAttribArray(aNormalLocation2);
  gl.enableVertexAttribArray(aPositionLocation3);
  gl.enableVertexAttribArray(aNormalLocation3);

  //initialize buffers for the square
  initCubeBuffer();
  initSphereBuffer();

  drawScene();
}
