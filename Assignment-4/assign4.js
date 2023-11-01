////////////////////////////////////////////////////////////////////////
// A WebGL program to show texture mapping on a sphere..

var gl;
var canvas;
var matrixStack = [];

var zAngle = 0.0;
var yAngle = 0.0;
// var prevMouseX = 0.0;
// var prevMouseY = 0.0;
var aPositionLocation;
// var aNormalLocation;
var aTextureLocation;
var uVMatrixLocation;
var uMMatrixLocation;
var uPMatrixLocation;
// var uNormalLocation;
// var uWNormalLocation;
var foregroundTextureLocation;
var backgroundTextureLocation;
var alphaLocation;
var effectLocation;
var effectLocation2;
var contrastLocation;
var brightnessLocation;

var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); // projection matrix
// var nMatrix = mat4.create(); // normal matrix

var spBuf;
var spIndexBuf;
// var spNormalBuf;
var spTexBuf;

var sqVertexPositionBuffer;
var sqVertexIndexBuffer;
var sqTextureBuffer;
// var sqNormalBuffer;

var spVerts = [];
var spIndicies = [];
// var spNormals = [];
var spTexCoords = [];

var sampleTexture;
var foregroundImage = "";
var backgroundImage = "";

var eyePos = [0.0, 0.0, 1.1]; // camera/eye position
var xCam = 0;
var yCam = 0;
var zCam = 0;

var imageVal = "";
var effects = 0.0;
var effects2 = 0.0;
var radio;
var contrast = -50;
var brightness = 0.0;

//////////////////////////////////////////////////////////////////////////
const vertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec2 aTexCoords;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uWNMatrix;

out vec2 fragTexCoord;

void main() {
  mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;

  // pass texture coordinate to frag shader
  fragTexCoord = aTexCoords;

  // calcuie clip space position
  gl_Position =  projectionModelView * vec4(aPosition,1.0);
}`;

const fragShaderCode = `#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 fragTexCoord;
uniform sampler2D uForegroundTexture;
uniform sampler2D uBackgroundTexture;
uniform vec2 uTextureSize;
uniform float effects;
uniform float effects2;
uniform float contrast;
uniform float brightness;
uniform float uAlpha;
// varying vec2 vTexCoord;


void main() {
  fragColor = vec4(0,0,0,1);
  
  //look up texture color
  vec4 foregroundColor =  texture(uForegroundTexture, fragTexCoord);
  vec4 backgroundColor = texture(uBackgroundTexture, fragTexCoord);
  float alpha = foregroundColor.a+(1.0-foregroundColor.a)*backgroundColor.a;
  vec4 textureColor = (foregroundColor.a*foregroundColor+(1.0-foregroundColor.a)*backgroundColor.a*backgroundColor)/alpha;
  // vec4 textureColor = mix(backgroundColor, foregroundColor, uAlpha);
  // vec4 textureColor = foregroundColor*0.5+backgroundColor*0.5;
  
  if(effects2==1.0){
    vec2 texelSize = vec2(5) / vec2(textureSize(uBackgroundTexture, 0));
    vec4 sum = vec4(0.0);

    float kernel[9];
        kernel[0] = 1.0;
        kernel[1] = 1.0;
        kernel[2] = 1.0;
        kernel[3] = 1.0;
        kernel[4] = 1.0;
        kernel[5] = 1.0;
        kernel[6] = 1.0;
        kernel[7] = 1.0;
        kernel[8] = 1.0;
  
   for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
                sum += texture(uBackgroundTexture, fragTexCoord + vec2(float(i), float(j)) * texelSize) * kernel[i+1+(j+1)*3];
            }
        }
        
    if(sum==vec4(0.0)){sum=vec4(1.0);}
    textureColor = sum / 9.0; // Normalize by the sum of the kernel

  }

  
  else if(effects2==2.0){
    vec2 texelSize = vec2(5) / vec2(textureSize(uBackgroundTexture, 0));
    vec4 sum = vec4(0.0);

    float kernel[9];
        kernel[0] = 0.0;
        kernel[1] = -1.0;
        kernel[2] = 0.0;
        kernel[3] = -1.0;
        kernel[4] = 5.0;
        kernel[5] = -1.0;
        kernel[6] = 0.0;
        kernel[7] = -1.0;
        kernel[8] = 0.0;
  
   for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
                sum += texture(uBackgroundTexture, fragTexCoord + vec2(float(i), float(j)) * texelSize) * kernel[i+1+(j+1)*3];
            }
        }
    // if(sum==vec4(0.0)){sum=vec4(1.0);}
    textureColor = sum / 1.0; // Normalize by the sum of the kernel

  }

  
  else if(effects2==4.0){
    vec2 texelSize = vec2(5) / vec2(textureSize(uBackgroundTexture, 0));
    vec4 sum = vec4(0.0);

    float kernel[9];
        kernel[0] = 0.0;
        kernel[1] = -1.0;
        kernel[2] = 0.0;
        kernel[3] = -1.0;
        kernel[4] = 4.0;
        kernel[5] = -1.0;
        kernel[6] = 0.0;
        kernel[7] = -1.0;
        kernel[8] = 0.0;
  
   for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
                sum += texture(uBackgroundTexture, fragTexCoord + vec2(float(i), float(j)) * texelSize) * kernel[i+1+(j+1)*3];
            }
        }
    // if(sum==vec4(0.0)){sum=vec4(1.0);}
    textureColor = sum / 1.0; // Normalize by the sum of the kernel

  }

  else if(effects2==3.0){
        vec2 texelSize = vec2(5) / vec2(textureSize(uBackgroundTexture, 0));

    vec4 dy = 0.5*(texture(uBackgroundTexture, fragTexCoord + vec2(0.0, -1.0) * texelSize)-texture(uBackgroundTexture, fragTexCoord + vec2(0.0, 1.0) * texelSize));
    vec4 dx = 0.5*(texture(uBackgroundTexture, fragTexCoord + vec2(1.0, 0.0) * texelSize)-texture(uBackgroundTexture, fragTexCoord + vec2(-1.0, 0.0) * texelSize));
    vec4 gradientMag = sqrt(dx*dx+dy*dy);
    textureColor = gradientMag;
  }


  if(effects == 1.0){
    float gray = (textureColor.x + textureColor.y + textureColor.z) / 3.0;
    textureColor = vec4(gray, gray, gray, textureColor.a);
  }
  else if(effects == 2.0){
    float sepiaR = 0.393*textureColor.x + 0.769*textureColor.y + 0.189*textureColor.z;
    float sepiaG = 0.349*textureColor.x + 0.686*textureColor.y + 0.168*textureColor.z;
    float sepiaB = 0.272*textureColor.x + 0.534*textureColor.y + 0.131*textureColor.z;
    textureColor = vec4(sepiaR, sepiaG, sepiaB, 1.0);
  }

  float c = brightness / 100.0;
  vec3 adjustedColor = textureColor.xyz + c;
  adjustedColor = 0.5 + (contrast / 100.0 + 1.0) * (adjustedColor - 0.5);

  // Shift to [-0.5, 0.5] range
  adjustedColor -= 0.5;
  // Scale the values
  adjustedColor *= 2.0;
  // Shift back to [0, 1] range
  adjustedColor += 0.5;

  fragColor = vec4(adjustedColor, 1.0);
  // fragColor = textureColor;
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

  // check for compiiion and linking status
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
    gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true }); // the graphics webgl2 context
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

// New sphere initialization function
// function initSphere(nslices, nstacks, radius) {
//   for (var i = 0; i <= nslices; i++) {
//     var angle = (i * Math.PI) / nslices;
//     var comp1 = Math.sin(angle);
//     var comp2 = Math.cos(angle);

//     for (var j = 0; j <= nstacks; j++) {
//       var phi = (j * 2 * Math.PI) / nstacks;
//       var comp3 = Math.sin(phi);
//       var comp4 = Math.cos(phi);

//       var xcood = comp4 * comp1;
//       var ycoord = comp2;
//       var zcoord = comp3 * comp1;
//       var utex = 1 - j / nstacks;
//       var vtex = 1 - i / nslices;

//       spVerts.push(radius * xcood, radius * ycoord, radius * zcoord);
//       spNormals.push(xcood, ycoord, zcoord);
//       spTexCoords.push(utex, vtex);
//     }
//   }

//   // now compute the indices here
//   for (var i = 0; i < nslices; i++) {
//     for (var j = 0; j < nstacks; j++) {
//       var id1 = i * (nstacks + 1) + j;
//       var id2 = id1 + nstacks + 1;

//       spIndicies.push(id1, id2, id1 + 1);
//       spIndicies.push(id2, id2 + 1, id1 + 1);
//     }
//   }
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

// function drawSphere(color) {
//   gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
//   gl.vertexAttribPointer(
//     aPositionLocation,
//     spBuf.itemSize,
//     gl.FLOAT,
//     false,
//     0,
//     0
//   );

//   gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
//   gl.vertexAttribPointer(
//     aTextureLocation,
//     spTexBuf.itemSize,
//     gl.FLOAT,
//     false,
//     0,
//     0
//   );

//   // Draw elementary arrays - triangle indices
//   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);

//   gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
//   gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
//   gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
//   gl.uniform1f(effectLocation, effects);

//   // for texture binding
//   gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
//   gl.bindTexture(gl.TEXTURE_2D, sampleTexture); // bind the texture object to the texture unit
//   gl.uniform1i(foregroundTextureLocation, 0); // pass the texture unit to the shader

//   gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
// }

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

  // const sqNormal = new Float32Array([
  //   0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
  // ]);
  // sqNormalBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, sqNormalBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, sqNormal, gl.STATIC_DRAW);
  // sqNormalBuffer.itemSize = 3;
  // sqNormalBuffer.numItems = 4;

  const sqTexture = new Float32Array([1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0]);
  sqTextureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqTextureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqTexture, gl.STATIC_DRAW);
  sqTextureBuffer.itemSize = 2;
  sqTextureBuffer.numItems = 4;
}

function drawSquare(color) {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);

  gl.uniform4fv(uDiffuseTermLocation, color);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.uniform1f(effectLocation, effects);
  gl.uniform1f(effectLocation2, effects2);
  gl.uniform1f(contrastLocation, contrast);
  gl.uniform1f(brightnessLocation, brightness);

  // gl.uniform3fv(uEyePosLocation, eyePos);

  // console.log(sqNormalBuffer.itemSize);
  // gl.bindBuffer(gl.ARRAY_BUFFER, sqNormalBuffer);
  // gl.vertexAttribPointer(
  //   aNormalLocation,
  //   sqNormalBuffer.itemSize,
  //   gl.FLOAT,
  //   false,
  //   0,
  //   0
  // );

  gl.bindBuffer(gl.ARRAY_BUFFER, sqTextureBuffer);
  gl.vertexAttribPointer(
    aTextureLocation,
    sqTextureBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    sqVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  // gl.uniformMatrix4fv(uNormalLocation, false, nMatrix);

  var wnMatrix = mat4.transpose(mat4.inverse(mMatrix));
  // gl.uniformMatrix4fv(uWNormalLocation, false, wnMatrix);

  gl.drawElements(
    gl.TRIANGLES,
    sqVertexIndexBuffer.numItems,
    gl.UNSIGNED_INT,
    0
  );
}

function initTextures(texFile) {
  var tex = gl.createTexture();
  tex.image = new Image();
  tex.image.src = texFile;
  tex.image.onload = function () {
    handleTextureLoaded(tex);
  };
  return tex;
}

function initTextureAlpha(foregroundTexture, backgroundTexture) {
  const textureUnit = 0;

  var foregroundTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, foregroundTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    foregroundImage
  );
  gl.generateMipmap(gl.TEXTURE_2D);

  var backgroundTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    backgroundImage
  );
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, foregroundTexture);
  gl.uniform1i(foregroundTextureLocation, textureUnit);

  gl.activeTexture(gl.TEXTURE0 + textureUnit + 1);
  gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
  gl.uniform1i(backgroundTextureLocation, textureUnit + 1);

  gl.uniform1f(alphaLocation, 0.5);
}

function handleTextureLoaded(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // use it to flip Y if needed
  gl.texImage2D(
    gl.TEXTURE_2D, // 2D texture
    0, // mipmap level
    gl.RGBA, // internal format
    gl.RGBA, // format
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

  drawScene();
}

//////////////////////////////////////////////////////////////////////
//The main drawing routine
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearColor(0.992, 0.894, 0.949, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // gl.enable(gl.DEPTH_TEST);

  //set up the model matrix
  mat4.identity(mMatrix);

  // set up the view matrix, multiply into the modelview matrix
  mat4.identity(vMatrix);
  vMatrix = mat4.lookAt(eyePos, [xCam, yCam, zCam], [0, 1, 0], vMatrix);

  //set up projection matrix
  mat4.identity(pMatrix);
  mat4.perspective(60, 1.0, 0.01, 1000, pMatrix);

  pushMatrix(matrixStack, mMatrix);
  color = [1.0, 1.0, 0.0, 1.0];
  mMatrix = mat4.scale(mMatrix, [1.2, 1.2, 1.2]);
  drawSquare(color);
  mMatrix = popMatrix(matrixStack);
}

// This is the entry point from the html

var slider1;
function sliderChanged1() {
  contrast = parseFloat(slider1.value);
  // console.log(contrast);
  drawScene();
}

var slider2;
function sliderChanged2() {
  brightness = parseFloat(slider2.value);
  // console.log(brightness);
  drawScene();
}

function webGLStart() {
  canvas = document.getElementById("assign4");
  // document.addEventListener("mousedown", onMouseDown, false);

  var backTex, foreTex;
  initGL(canvas);

  document
    .getElementById("imageInput1")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          // const image = new Image();
          backgroundImage = e.target.result;
          // backTex = initTextures(backgroundImage);
          // if (imageVal == "A" || imageVal == "B") {
          //   console.log(1);
          //   backTex = initTextures(backgroundImage);
          // }
        };
        reader.readAsDataURL(file);
      }
    });

  document
    .getElementById("imageInput2")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          // const image = new Image();
          foregroundImage = e.target.result;
          // foreTex = initTextures(foregroundImage);
          // if (imageVal == "B") {
          //   console.log(2);
          //   foreTex = initTextures(foregroundImage);
          //   // initTextureAlpha(foregroundImage, backgroundImage);
          // }
        };
        reader.readAsDataURL(file);
      }
    });

  var radios1 = document.forms["formA"].elements["myradio"];
  for (radio in radios1) {
    radios1[radio].onclick = function () {
      imageVal = this.value;
      if (imageVal == "A") {
        backTex = initTextures(backgroundImage);
        console.log(3);
        gl.activeTexture(gl.TEXTURE1); // Select the texture unit you want to change
        gl.bindTexture(gl.TEXTURE_2D, backTex);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, backTex);
        gl.uniform1i(backgroundTextureLocation, 0);

        drawScene();
        // initTextures(backgroundImage);
      }
      if (imageVal == "B") {
        effects2 = 0.0;
        var radios3 = document.forms["formC"].elements["myradio"];
        for (radio in radios3) {
          radios3[radio].checked = false;
        }
        console.log(4);
        backTex = initTextures(backgroundImage);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, backTex);
        gl.uniform1i(backgroundTextureLocation, 0);

        foreTex = initTextures(foregroundImage);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, foreTex);
        gl.uniform1i(foregroundTextureLocation, 1);

        drawScene();
        // initTextureAlpha(foregroundImage, backgroundImage);
      }
    };
  }

  var radios2 = document.forms["formB"].elements["myradio"];
  for (radio in radios2) {
    radios2[radio].onclick = function () {
      effects = parseFloat(this.value);
      // console.log(effects);
      drawScene();
    };
  }

  const element = document.getElementById("myBtn");
  element.addEventListener("click", function () {
    effects = 0.0;
    var radios2 = document.forms["formB"].elements["myradio"];
    for (radio in radios2) {
      radios2[radio].checked = false;
    }
    drawScene();
  });

  slider1 = document.getElementById("myRange1");
  slider1.addEventListener("input", sliderChanged1);

  slider2 = document.getElementById("myRange2");
  slider2.addEventListener("input", sliderChanged2);

  var radios3 = document.forms["formC"].elements["myradio"];
  for (radio in radios3) {
    radios3[radio].onclick = function () {
      effects2 = parseFloat(this.value);
      console.log(effects2);
      drawScene();
    };
  }

  const element2 = document.getElementById("myBtn2");
  element2.addEventListener("click", function () {
    effects2 = 0.0;
    var radios3 = document.forms["formC"].elements["myradio"];
    for (radio in radios3) {
      radios3[radio].checked = false;
    }
    drawScene();
  });

  const reset = document.getElementById("reset");

  // Add a click event listener
  reset.addEventListener("click", function () {
    effects = 0.0;
    effects2 = 0.0;
    slider1.value = -50.0;
    contrast = -50.0;
    slider2.value = 0.0;
    brightness = 0.0;

    var radios2 = document.forms["formB"].elements["myradio"];
    for (radio in radios2) {
      radios2[radio].checked = false;
    }
    var radios3 = document.forms["formC"].elements["myradio"];
    for (radio in radios3) {
      radios3[radio].checked = false;
    }

    drawScene();
  });

  const elem = document.querySelector("#save");
  elem.addEventListener("click", () => {
    // drawScene();
    canvas.toBlob((blob) => {
      saveBlob(blob, `processed_output.png`);
    });
  });

  const saveBlob = (function () {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    return function saveData(blob, fileName) {
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      a.click();
    };
  })();

  shaderProgram = initShaders();

  //get locations of attributes declared in the vertex shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  // aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
  aTextureLocation = gl.getAttribLocation(shaderProgram, "aTexCoords");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  // uNormalLocation = gl.getUniformLocation(shaderProgram, "uNMatrix");
  // uWNormalLocation = gl.getUniformLocation(shaderProgram, "uWNMatrix");
  uDiffuseTermLocation = gl.getUniformLocation(shaderProgram, "objColor");

  //texture location in shader
  foregroundTextureLocation = gl.getUniformLocation(
    shaderProgram,
    "uForegroundTexture"
  );
  backgroundTextureLocation = gl.getUniformLocation(
    shaderProgram,
    "uBackgroundTexture"
  );
  alphaLocation = gl.getUniformLocation(shaderProgram, "uAlpha");

  effectLocation = gl.getUniformLocation(shaderProgram, "effects");
  effectLocation2 = gl.getUniformLocation(shaderProgram, "effects2");
  contrastLocation = gl.getUniformLocation(shaderProgram, "contrast");
  brightnessLocation = gl.getUniformLocation(shaderProgram, "brightness");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);
  // gl.enableVertexAttribArray(aNormalLocation);
  gl.enableVertexAttribArray(aTextureLocation);

  //initialize buffers for the square
  initSquareBuffer();
  // initSphereBuffer();
  // sampleTexture = initTextures(foregroundImage);

  drawScene();
}
