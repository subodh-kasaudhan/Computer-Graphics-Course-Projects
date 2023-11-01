////////////////////////////////////////////////////////////////////////
//  A simple WebGL program to draw a 3D cube wirh basic interaction.
//

var gl;
var canvas;
var speed = 0;
var obj1 = 0;

var viewPort0;

var rubrikCubeTexture;
var woodenTexture;
var cubeMapTexture;

// Add Image Path
var posx_file = "./Nvidia_cubemap/posx.jpg";
var negx_file = "./Nvidia_cubemap/negx.jpg";
var posy_file = "./Nvidia_cubemap/posy.jpg";
var negy_file = "./Nvidia_cubemap/negy.jpg";
var posz_file = "./Nvidia_cubemap/posz.jpg";
var negz_file = "./Nvidia_cubemap/negz.jpg";
var posx, posy, posz, negx, negy, negz;

var matrixStack = [];
function pushMatrix(stack, m) {
  //necessary because javascript only does shallow push
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack) {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

var sqVertexPositionBuffer;
var sqVertexIndexBuffer;
var sqTextureBuffer;
var sqNormalBuffer;

var cubeBuf;
var cubeNormalBuf;
var cubeIndexBuf;
var cubeTexBuf;

var spBuf;
var spIndexBuf;
var spNormalBuf;
var spTexBuf;
var spVerts = [];
var spIndicies = [];
var spNormals = [];
var spTexCoords = [];

var objVertexPositionBuffer;
var objVertexNormalBuffer;
var objVertexTextureBuffer;
var objVertexIndexBuffer;

// initialize model, view, and projection matrices
var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); //projection matrix
var nMatrix = mat4.create();

var degree = 0;
var eyePos = [5.5, 2.0, 5.5];
var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

var lightPos = [0.0, 20.0, 30.0];

const perFragVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexture;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uNMatrix;
uniform mat4 uWNMatrix;

uniform vec4 objColor;

out vec3 v_worldPosition;
out vec3 v_worldNormal;

out vec3 normal;
out vec2 fragTexCoord;
out vec3 vertexColor;
out vec3 posInEyeSpace;

void main() {
  
  mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;

  gl_Position =  projectionModelView * vec4(aPosition,1.0);

  posInEyeSpace = vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0));
  gl_PointSize=5.0;

  normal = normalize(vec3(uNMatrix * vec4(aNormal, 0.0)));
  
  v_worldPosition = vec3(uMMatrix * vec4(aPosition, 1.0));
  v_worldNormal = normalize(vec3(uWNMatrix * vec4(aNormal, 0.0)));
  
  vertexColor = vec3(objColor);
  fragTexCoord = aTexture;

}`;

const perFragFragShaderCode = `#version 300 es
precision mediump float;

in vec3 vertexColor;
in vec3 posInEyeSpace;
in vec3 normal;
in vec2 fragTexCoord;
out vec4 fragColor;
uniform vec3 lightPos;
uniform sampler2D imageTexture;
uniform samplerCube cubeMap;

uniform float obj;

uniform vec3 eyePos;
in vec3 v_worldPosition;
in vec3 v_worldNormal;


void main() {
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - eyePos);
  vec3 directionReflection = reflect(eyeToSurfaceDir, v_worldNormal);
  

  vec3 L = normalize(lightPos-posInEyeSpace);
  vec3 R = normalize(-reflect(L, normal));
  vec3 V = normalize(-posInEyeSpace);
  
  vec3 light_spec=(pow(max(dot(V,R),0.0),10.0))*vec3(1.0,1.0,1.0);
  vec3 light_ambient=0.1*(vertexColor);
  vec3 light_diffused=max(dot(L, normal),0.0)*vertexColor;
  vec4 phongColor = vec4(light_diffused+light_ambient+light_spec,1.0);
  


  if(obj == 1.0 || obj == 5.0){
    fragColor = texture(imageTexture, fragTexCoord);
  }
  else if(obj == 2.0){
    vec4 envColor = texture(cubeMap, directionReflection);
    fragColor = envColor;
  }
  else if(obj == 3.0){
    vec4 envColor = texture(cubeMap, directionReflection);
    fragColor = 0.5*envColor + 0.5*phongColor;
  }
  else if(obj == 4.0){
    vec3 directionRefraction = refract(eyeToSurfaceDir, v_worldNormal, 0.82);
    fragColor = texture(cubeMap, directionRefraction);
  }
  else if(obj == 6.0){
    vec4 texColor = texture(imageTexture, fragTexCoord);
    vec4 envColor = texture(cubeMap, directionReflection);
    fragColor = 0.7*texColor+0.2*envColor+0.1*phongColor;
  }
}`;

class viewPort {
  // degree1;
  // degree0;
  // prevMouseX;
  // prevMouseY;

  aPositionLocation;
  aNormalLocation;
  aTextureLocation;
  uPMatrixLocation;
  uMMatrixLocation;
  uVMatrixLocation;
  uNormalLocation;
  uWNormalLocation;
  uTextureLocation;
  uCubeMapLocation;
  lightLocation;
  uEyePosLocation;
  shaderProgram;
  vertexShaderCode;
  fragShaderCode;
  modeLocation;

  initShaders() {
    this.shaderProgram = gl.createProgram();

    var vertexShader = vertexShaderSetup(this.vertexShaderCode);
    var fragmentShader = fragmentShaderSetup(this.fragShaderCode);

    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      console.log(gl.getShaderInfoLog(vertexShader));
      console.log(gl.getShaderInfoLog(fragmentShader));
    }

    gl.useProgram(this.shaderProgram);
  }

  constructor(vertexShaderCode, fragShaderCode) {
    // this.degree1 = 0.0;
    // this.degree0 = 0.0;
    // this.prevMouseX = 0.0;
    // this.prevMouseY = 0.0;

    this.vertexShaderCode = vertexShaderCode;
    this.fragShaderCode = fragShaderCode;
    this.initShaders();

    this.uWNormalLocation = gl.getUniformLocation(
      this.shaderProgram,
      "uWNMatrix"
    );
    this.aNormalLocation = gl.getAttribLocation(this.shaderProgram, "aNormal");
    this.aTextureLocation = gl.getAttribLocation(
      this.shaderProgram,
      "aTexture"
    );
    this.uMMatrixLocation = gl.getUniformLocation(
      this.shaderProgram,
      "uMMatrix"
    );
    this.uVMatrixLocation = gl.getUniformLocation(
      this.shaderProgram,
      "uVMatrix"
    );
    this.uPMatrixLocation = gl.getUniformLocation(
      this.shaderProgram,
      "uPMatrix"
    );
    this.uDiffuseTermLocation = gl.getUniformLocation(
      this.shaderProgram,
      "objColor"
    );
    this.uNormalLocation = gl.getUniformLocation(
      this.shaderProgram,
      "uNMatrix"
    );
    this.uTextureLocation = gl.getUniformLocation(
      this.shaderProgram,
      "imageTexture"
    );
    this.uCubeMapLocation = gl.getUniformLocation(
      this.shaderProgram,
      "cubeMap"
    );
    this.aPositionLocation = gl.getAttribLocation(
      this.shaderProgram,
      "aPosition"
    );
    gl.enableVertexAttribArray(this.aPositionLocation);
    gl.enableVertexAttribArray(this.aNormalLocation);
    gl.enableVertexAttribArray(this.aTextureLocation);
    this.uEyePosLocation = gl.getUniformLocation(this.shaderProgram, "eyePos");
    this.lightLocation = gl.getUniformLocation(this.shaderProgram, "lightPos");
    this.modeLocation = gl.getUniformLocation(this.shaderProgram, "obj");
  }
}

function vertexShaderSetup(vertexShaderCode) {
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
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

function initSquareBuffer() {
  const sqIndices = new Uint32Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemSize = 1;
  sqVertexIndexBuffer.numItems = 6;

  const sqVertices = new Float32Array([
    0.5, 0.5, 0.0, -0.5, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 3;
  sqVertexPositionBuffer.numItems = 4;

  const sqNormal = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
  ]);
  sqNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqNormal, gl.STATIC_DRAW);
  sqNormalBuffer.itemSize = 3;
  sqNormalBuffer.numItems = 4;

  const sqTexture = new Float32Array([1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0]);
  sqTextureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqTextureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqTexture, gl.STATIC_DRAW);
  sqTextureBuffer.itemSize = 2;
  sqTextureBuffer.numItems = 4;
}

function drawSquare(view, color) {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);

  gl.uniform4fv(view.uDiffuseTermLocation, color);
  gl.uniformMatrix4fv(view.uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(view.uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(view.uPMatrixLocation, false, pMatrix);
  gl.uniform3fv(view.uEyePosLocation, eyePos);

  gl.bindBuffer(gl.ARRAY_BUFFER, sqNormalBuffer);
  gl.vertexAttribPointer(
    view.aNormalLocation,
    sqNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, sqTextureBuffer);
  gl.vertexAttribPointer(
    view.aTextureLocation,
    sqTextureBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(
    view.aPositionLocation,
    sqVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.uniformMatrix4fv(view.uNormalLocation, false, nMatrix);

  var wnMatrix = mat4.transpose(mat4.inverse(mMatrix));
  gl.uniformMatrix4fv(view.uWNormalLocation, false, wnMatrix);

  gl.drawElements(
    gl.TRIANGLES,
    sqVertexIndexBuffer.numItems,
    gl.UNSIGNED_INT,
    0
  );
}

function initObject() {
  var request = new XMLHttpRequest();
  request.open("GET", "./Nvidia_cubemap/teapot.json");
  request.overrideMimeType("application/json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      processObject(JSON.parse(request.responseText));
      initCubeMap();
    }
  };
  request.send();
}

function processObject(objData) {
  objVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexNormals),
    gl.STATIC_DRAW
  );
  objVertexNormalBuffer.itemSize = 3;
  objVertexNormalBuffer.numItems = objData.vertexNormals.length / 3;

  objVertexTextureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTextureBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexTextureCoords),
    gl.STATIC_DRAW
  );
  objVertexTextureBuffer.itemSize = 2;
  objVertexTextureBuffer.numItems = objData.vertexTextureCoords.length / 2;

  objVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(objData.indices),
    gl.STATIC_DRAW
  );
  objVertexIndexBuffer.itemSize = 1;
  objVertexIndexBuffer.numItems = objData.indices.length;

  objVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexPositions),
    gl.STATIC_DRAW
  );
  objVertexPositionBuffer.itemSize = 3;
  objVertexPositionBuffer.numItems = objData.vertexPositions.length / 3;
}

function drawObject(view, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
  gl.vertexAttribPointer(
    view.aPositionLocation,
    objVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
  gl.vertexAttribPointer(
    view.aNormalLocation,
    objVertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTextureBuffer);
  gl.vertexAttribPointer(
    view.aTextureLocation,
    objVertexTextureBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);

  gl.uniform4fv(view.uDiffuseTermLocation, color);
  gl.uniformMatrix4fv(view.uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(view.uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(view.uPMatrixLocation, false, pMatrix);
  gl.uniform3fv(view.uEyePosLocation, eyePos);

  gl.uniformMatrix4fv(view.uNormalLocation, false, nMatrix);

  var wnMatrix = mat4.transpose(mat4.inverse(mMatrix));
  gl.uniformMatrix4fv(view.uWNormalLocation, false, wnMatrix);
  gl.drawElements(
    gl.TRIANGLES,
    objVertexIndexBuffer.numItems,
    gl.UNSIGNED_INT,
    0
  );
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
  cubeBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeBuf.itemSize = 3;
  cubeBuf.numItems = vertices.length / 3;

  var normals = [
    // Front
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    // Back
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    // Top
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    // Bottom
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
    // Right
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    // Left
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ];
  cubeNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  cubeNormalBuf.itemSize = 3;
  cubeNormalBuf.numItems = normals.length / 3;

  var texCoords = [
    // Front
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Back
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Top
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Bottom
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Right
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Left
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ];
  cubeTexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTexBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  cubeTexBuf.itemSize = 2;
  cubeTexBuf.numItems = normals.length / 2;

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
  cubeIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(indices),
    gl.STATIC_DRAW
  );
  cubeIndexBuf.itemSize = 1;
  cubeIndexBuf.numItems = indices.length;
}

function drawCube(view, color, texture, useTexture) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
  gl.vertexAttribPointer(
    view.aPositionLocation,
    cubeBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.vertexAttribPointer(
    view.aNormalLocation,
    cubeNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTexBuf);
  gl.vertexAttribPointer(
    view.aTextureLocation,
    cubeTexBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);

  gl.uniform4fv(view.uDiffuseTermLocation, color);
  gl.uniformMatrix4fv(view.uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(view.uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(view.uPMatrixLocation, false, pMatrix);
  gl.uniform3fv(view.uEyePosLocation, eyePos);

  gl.uniformMatrix4fv(view.uNormalLocation, false, nMatrix);

  var wnMatrix = mat4.transpose(mat4.inverse(mMatrix));
  gl.uniformMatrix4fv(view.uWNormalLocation, false, wnMatrix);

  if (useTexture != 0) {
    gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
    gl.bindTexture(gl.TEXTURE_2D, texture); // bind the texture object to the texture unit
    gl.uniform1i(view.uTextureLocation, 1); // pass the texture unit to the shader
  }

  gl.drawElements(gl.TRIANGLES, cubeIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}

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
      var utex = 1 - j / nstacks;
      var vtex = 1 - i / nslices;

      spVerts.push(radius * xcood, radius * ycoord, radius * zcoord);
      spNormals.push(xcood, ycoord, zcoord);
      spTexCoords.push(utex, vtex);
    }
  }

  for (var i = 0; i < nslices; i++) {
    for (var j = 0; j < nstacks; j++) {
      var id1 = i * (nstacks + 1) + j;
      var id2 = id1 + nstacks + 1;

      spIndicies.push(id1, id2, id1 + 1);
      spIndicies.push(id2, id2 + 1, id1 + 1);
    }
  }
}

function drawSphere(view, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.vertexAttribPointer(
    view.aPositionLocation,
    spBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.vertexAttribPointer(
    view.aNormalLocation,
    spNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
  gl.vertexAttribPointer(
    view.aTextureLocation,
    spTexBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);

  gl.uniform4fv(view.uDiffuseTermLocation, color);
  gl.uniformMatrix4fv(view.uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(view.uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(view.uPMatrixLocation, false, pMatrix);
  gl.uniform3fv(view.uEyePosLocation, eyePos);

  nMatrix = mat4.multiply(vMatrix, mMatrix, nMatrix);
  nMatrix = mat4.transpose(nMatrix, nMatrix);
  nMatrix = mat4.inverse(nMatrix, nMatrix);
  gl.uniformMatrix4fv(view.uNormalLocation, false, nMatrix);

  var wnMatrix = mat4.transpose(mat4.inverse(mMatrix));
  gl.uniformMatrix4fv(view.uWNormalLocation, false, wnMatrix);

  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}

function initSphereBuffer() {
  var nslices = 50; // use even number
  var nstacks = 50;
  var radius = 1.0;
  initSphere(nslices, nstacks, radius);

  spBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
  spBuf.itemSize = 3;
  spBuf.numItems = spVerts.length / 3;

  spNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
  spNormalBuf.itemSize = 3;
  spNormalBuf.numItems = spNormals.length / 3;

  spTexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spTexCoords), gl.STATIC_DRAW);
  spTexBuf.itemSize = 2;
  spTexBuf.numItems = spTexCoords.length / 2;

  spIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(spIndicies),
    gl.STATIC_DRAW
  );
  spIndexBuf.itemsize = 1;
  spIndexBuf.numItems = spIndicies.length;
}

function initTextures(textureFile) {
  var tex = gl.createTexture();
  tex.image = new Image();
  tex.image.src = textureFile;
  tex.image.onload = function () {
    handleTextureLoaded(tex);
  };
  return tex;
}

function handleTextureLoaded(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, // 2D texture
    0, // mipmap level
    gl.RGB, // internal format
    gl.RGB, // format
    gl.UNSIGNED_BYTE, // type of data
    texture.image // array or <img>
  );

  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );

  obj1 += 1;
  initObject();
}

function drawScene() {
  var animate = function () {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(mMatrix);

    mat4.identity(vMatrix);
    vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);

    mat4.identity(pMatrix);
    mat4.perspective(60, 1.0, 0.01, 1000, pMatrix);

    drawRubrik();
    gl.activeTexture(gl.TEXTURE3); // set texture unit 0 to use
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture); // bind the texture object to the texture unit
    gl.uniform1i(viewPort0.uCubeMapLocation, 3); // pass the texture unit to the shader
    drawSkyBox();

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, -1.0, 0.0, 1.0]);

    drawTable();
    mMatrix = popMatrix(matrixStack);

    drawTeapot();
    drawBalls();
    drawPrism();

    degree += 0.04;
    eyePos = [
      5.5 * Math.cos(2 * Math.PI * degToRad(degree)),
      1.5,
      5 * Math.sin(2 * Math.PI * degToRad(degree)),
    ];

    window.requestAnimationFrame(animate);
  };
  animate();
}

function webGLStart() {
  canvas = document.getElementById("Load");

  initGL(canvas);

  gl.enable(gl.DEPTH_TEST);
  viewPort0 = new viewPort(perFragVertexShaderCode, perFragFragShaderCode);

  initCubeBuffer();
  initSquareBuffer();
  initSphereBuffer();
  rubrikCubeTexture = initTextures("./Nvidia_cubemap/rcube.png");
  woodenTexture = initTextures("./Nvidia_cubemap/wood_texture.jpg");
  posx = initTextures(posx_file);
  posy = initTextures(posy_file);
  posz = initTextures(posz_file);
  negx = initTextures(negx_file);
  negy = initTextures(negy_file);
  negz = initTextures(negz_file);
}

function drawPrism() {
  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.scale(mMatrix, [0.8, 1.3, 0.8]);
  mMatrix = mat4.translate(mMatrix, [-1.6, 0.0, 1.5]);
  gl.uniform1f(viewPort0.modeLocation, 4.0);
  drawCube(viewPort0, color, rubrikCubeTexture, 0);
  mMatrix = popMatrix(matrixStack);
}

function drawRubrik() {
  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.rotate(mMatrix, degToRad(30), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(5), [1, 1, 0]);
  mMatrix = mat4.scale(mMatrix, [0.6, 0.6, 0.6]);
  mMatrix = mat4.translate(mMatrix, [1.4, -0.4, 2.5, 1.0]);
  gl.uniform1f(viewPort0.modeLocation, 1);
  drawCube(viewPort0, color, rubrikCubeTexture, 1);
  mMatrix = popMatrix(matrixStack);
}

function drawTable() {
  gl.uniform1f(viewPort0.modeLocation, 6);
  gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, woodenTexture); // bind the texture object to the texture unit
  gl.uniform1i(viewPort0.uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);

  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.scale(mMatrix, [3.0, 0.3, 3.0]);
  mMatrix = mat4.translate(mMatrix, [0.0, 0.0, 0.0, 1.0]);
  drawSphere(viewPort0, color);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [-2.5, -2.0, -1.0, 1.0]);
  mMatrix = mat4.scale(mMatrix, [0.3, 4.0, 0.3]);
  drawCube(viewPort0, color, woodenTexture, 1);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [2.5, -2.0, -1.0, 1.0]);
  mMatrix = mat4.scale(mMatrix, [0.3, 4.0, 0.3]);
  drawCube(viewPort0, color, woodenTexture, 1);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [-2.5, -2.0, 1.0, 1.0]);
  mMatrix = mat4.scale(mMatrix, [0.3, 4.0, 0.3]);
  drawCube(viewPort0, color, woodenTexture, 1);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [2.5, -2.0, 1.0, 1.0]);
  mMatrix = mat4.scale(mMatrix, [0.3, 4.0, 0.3]);
  drawCube(viewPort0, color, woodenTexture, 1);
  mMatrix = popMatrix(matrixStack);
}

function drawSkyBox() {
  gl.uniform1f(viewPort0.modeLocation, 5);

  gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, negz); // bind the texture object to the texture unit
  gl.uniform1i(viewPort0.uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [0, 0.0, -99.5]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
  drawSquare(viewPort0, color);
  mMatrix = popMatrix(matrixStack);

  gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, posz); // bind the texture object to the texture unit
  gl.uniform1i(viewPort0.uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [0, 0.0, 99.5]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 1, 0]);
  mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
  drawSquare(viewPort0, color);
  mMatrix = popMatrix(matrixStack);

  gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, negy); // bind the texture object to the texture unit
  gl.uniform1i(viewPort0.uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [0.0, -99.5, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(-90), [1, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
  drawSquare(viewPort0, color);
  mMatrix = popMatrix(matrixStack);

  gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, posy); // bind the texture object to the texture unit
  gl.uniform1i(viewPort0.uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [0.0, 99.5, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(90), [1, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
  drawSquare(viewPort0, color);
  mMatrix = popMatrix(matrixStack);

  gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, posx); // bind the texture object to the texture unit
  gl.uniform1i(viewPort0.uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [99.5, 0.0, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(-90), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
  drawSquare(viewPort0, color);
  mMatrix = popMatrix(matrixStack);

  gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, negx); // bind the texture object to the texture unit
  gl.uniform1i(viewPort0.uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [-99.5, 0.0, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(90), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [200, 200, 200]);
  drawSquare(viewPort0, color);
  mMatrix = popMatrix(matrixStack);
}

function drawTeapot() {
  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.translate(mMatrix, [0.0, 0.2, -0.5, 1.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(30), [0, 1, 0]);
  mMatrix = mat4.scale(mMatrix, [0.12, 0.12, 0.12]);
  gl.uniform1f(viewPort0.modeLocation, 2);
  drawObject(viewPort0, [0.0, 0.0, 0.0, 0.0]);
  mMatrix = popMatrix(matrixStack);
}

function drawBalls() {
  gl.uniform1f(viewPort0.modeLocation, 3);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.3, -0.3, 1.8, 1.0]);
  mMatrix = mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
  drawSphere(viewPort0, [0.2, 0.7, 0.2, 1.0]);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [1.5, -0.4, -0.5, 1.0]);
  mMatrix = mat4.scale(mMatrix, [0.4, 0.4, 0.4]);
  drawSphere(viewPort0, [0.0, 0.0, 0.54, 1.0]);
  mMatrix = popMatrix(matrixStack);
}

// function onMouseDown(event) {
//   // document.addEventListener("mousemove", onMouseMove, false);
//   // document.addEventListener("mouseup", onMouseUp, false);
//   // document.addEventListener("mouseout", onMouseOut, false);
// }

// function onMouseMove(event) {
//   // make mouse interaction only within canvas
//   if (
//     event.layerX <= canvas.width &&
//     event.layerX >= 0 &&
//     event.layerY <= canvas.height &&
//     event.layerY >= 0
//   ) {
//     var mouseX = event.clientX;
//     var diffX1 = mouseX - viewPort0.prevMouseX;
//     viewPort0.prevMouseX = mouseX;
//     viewPort0.degree0 = viewPort0.degree0 + diffX1 / 5;

//     var mouseY = canvas.height - event.clientY;
//     var diffY2 = mouseY - viewPort0.prevMouseY;
//     viewPort0.prevMouseY = mouseY;
//     viewPort0.degree1 = viewPort0.degree1 - diffY2 / 5;

//     drawScene();
//   }
// }

// function onMouseUp(event) {
//   document.removeEventListener("mousemove", onMouseMove, false);
//   document.removeEventListener("mouseup", onMouseUp, false);
//   document.removeEventListener("mouseout", onMouseOut, false);
// }

// function onMouseOut(event) {
//   document.removeEventListener("mousemove", onMouseMove, false);
//   document.removeEventListener("mouseup", onMouseUp, false);
//   document.removeEventListener("mouseout", onMouseOut, false);
// }

// function initSphereBuffer() {
//   var nslices = 50;
//   var nstacks = 50;
//   var radius = 1.0;

//   initSphere(nslices, nstacks, radius);

//   // buffer for vertices
//   spBuf = gl.createBuffer();
//   gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
//   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
//   spBuf.itemSize = 3;
//   spBuf.numItems = spVerts.length / 3;

//   // buffer for indices
//   spIndexBuf = gl.createBuffer();
//   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
//   gl.bufferData(
//     gl.ELEMENT_ARRAY_BUFFER,
//     new Uint32Array(spIndicies),
//     gl.STATIC_DRAW
//   );
//   spIndexBuf.itemsize = 1;
//   spIndexBuf.numItems = spIndicies.length;

//   // buffer for normals
//   spNormalBuf = gl.createBuffer();
//   gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
//   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
//   spNormalBuf.itemSize = 3;
//   spNormalBuf.numItems = spNormals.length / 3;

//   // buffer for texture coordinates
//   spTexBuf = gl.createBuffer();
//   gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
//   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spTexCoords), gl.STATIC_DRAW);
//   spTexBuf.itemSize = 2;
//   spTexBuf.numItems = spTexCoords.length / 2;
// }

function initCubeMap() {
  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: posx_file,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: negx_file,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: posy_file,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: negy_file,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: posz_file,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: negz_file,
    },
  ];

  cubeMapTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);

  faceInfos.forEach((faceInfo) => {
    const { target, url } = faceInfo;

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.texImage2D(
      target,
      level,
      internalFormat,
      width,
      height,
      0,
      format,
      type,
      null
    );
    const image = new Image();
    image.src = url;
    image.addEventListener("load", function () {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      speed += 2;
      if (speed == 12) drawScene();
    });
  });

  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(
    gl.TEXTURE_CUBE_MAP,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );
}
