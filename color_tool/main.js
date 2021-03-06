
var canvas;
var gl;
var verticesBuffer;
var verticesColorBuffer;
//var verticesIndexBuffer;
var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;


var image2DArray=[];
var imageWidth;
var imageHeight;
var orthogonal={
	l: 0,
	r: 100,
	t: 100,
	b: 0
};
//
// start
//
// Called when the canvas is created to get the ball rolling.
//
function start() {

	  canvas = document.getElementById("glcanvas");

	  initWebGL(canvas);      // Initialize the GL context

	  // Only continue if WebGL is available and working

	  if (gl) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

		// Initialize the shaders; this is where all the lighting for the
		// vertices and so forth is established.

		initShaders();

		// Here's where we call the routine that builds all the objects
		// we'll be drawing.

		initBuffers();

		// Set up to draw the scene periodically.
		drawScene();
		// no need to update screen every 15ms
		//setInterval(drawScene, 15);
	  }
	
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

//
// initBuffers
//
// Initialize the buffers we'll need.
//
function initBuffers() {

  // Create a buffer for the cube's vertices.

  verticesBuffer = gl.createBuffer();

  // Now create an array of vertices 
	//each value on the image2DArray is represented with a square with 4 vertices
	createImageVertices();

  // Now set up the colors 
	verticesColorBuffer = gl.createBuffer();

	createImageColors();

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.
  // -----not using this now --- this method will not display all the squares
  //just leaving this here for reference

  //verticesIndexBuffer = gl.createBuffer();
  //createImageVerticesIndex();
 
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  
  
  // Establish the perspective with which we want to view the
  // scene....
  // no not now ...perspectiveMatrix is a misnomer
  //it is actually orthogonal not perspective right now
  perspectiveMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);
	
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.

  loadIdentity();

  // Now move the drawing position a bit to where we want to start
  // drawing the square.
  mvTranslate([-0.0, 0.0, -6.0]);

  
	mvPushMatrix();
	//set position attribute of vertices
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the colors attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
  gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

  // Draw the squares
	
	//not drawing using indices right now
	//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
	
	//pass in uniforms to shader
	setMatrixUniforms();
	
	//draw the squares one by one as two triangles
	for(var i=0;i<imageWidth*imageHeight;i++){
		gl.drawArrays(gl.TRIANGLE_FAN, i*4, 4);
	}
	
	//again not using indices to draw because the index runs out of range (unsighed_short)
	//gl.drawElements(gl.TRIANGLES, imageWidth*imageHeight*6, gl.UNSIGNED_SHORT, 0);
	 mvPopMatrix();
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  
  vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexColorAttribute);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.

  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.

  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }

    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.

  var shader;

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object

  gl.shaderSource(shader, theSource);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function createImageVertices(){
	//total number of vertices = ImageWidth x imageHeight x 4
	//upper left of image at (0,imageHeight)
	//lower right of image at (imageWidth,0)
	var imageVertices=[];
	for(var i=imageHeight;i>0;i--){
		for(var j=0; j<imageWidth; j++){
			imageVertices.push(j);
			imageVertices.push(i);
			imageVertices.push(0);
			
			imageVertices.push(j+1);
			imageVertices.push(i);
			imageVertices.push(0);
			
			imageVertices.push(j+1);
			imageVertices.push(i-1);
			imageVertices.push(0);
			
			imageVertices.push(j);
			imageVertices.push(i-1);
			imageVertices.push(0);
			
		}
	}
	// Select the verticesBuffer as the one to apply vertex
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	
	 // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(imageVertices), gl.STATIC_DRAW);

}

function createImageColors(){
	//a color for each vertex
	var imageColors=[];
	for(var i=0;i<imageHeight;i++){
		for(var j=0; j<imageWidth; j++){
			var color=image2DArray[imageWidth*i+j];
			for(var k=0;k<4;k++){
				imageColors.push(color);
				imageColors.push(color);
				imageColors.push(color);
				imageColors.push(1);
			}
		}
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(imageColors), gl.STATIC_DRAW);
}

//not used for now
function createImageVerticesIndex(){
	var verticesIndex=[];
	//total imageWidth*imageHeight*2 triangles
	for(var i=0;i<imageWidth*imageHeight;i++){
		verticesIndex.push(4*i+0);
		verticesIndex.push(4*i+1);
		verticesIndex.push(4*i+2);
		
		verticesIndex.push(4*i+0);
		verticesIndex.push(4*i+2);
		verticesIndex.push(4*i+3);
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(verticesIndex), gl.STATIC_DRAW);
}

//set the orthogonal view to view the entire image
function setView(){
	orthogonal.l=0;
	orthogonal.r=imageWidth;
	orthogonal.b=0;
	orthogonal.t=imageHeight;
}


//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}
function mvScale(v){
	multMatrix(Matrix.Diagonal($V([v[0], v[1], v[2]])).ensure4x4());
}
var mvMatrixStack = [];
function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }

  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;

  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}
//
//handle the drop event
//

$(document).on('load',dropInit());
function dropInit(){
if(window.FileReader) { 
  addEventHandler(window, 'load', function() {
    var status = document.getElementById('status');
    var drop   = document.getElementById('drop');
    var list   = document.getElementById('list');
  	
    function cancel(e) {
       e.preventDefault(); 
    }
	
    addEventHandler(drop, 'dragover', cancel);
    addEventHandler(drop, 'dragenter', cancel);
	addEventHandler(drop,'drop', function(e) {
		e = e || window.event;
		cancel(e);
        e.stopPropagation();
        
        var files = e.dataTransfer.files; // Array of all files
        for (var i=0, file; file=files[i]; i++) {
                var reader = new FileReader();
                reader.onload = function(e2) { // finished reading file data.
					image2DArray=[];
					imageHeight=undefined;
					imageWidth=undefined;
					//parse the data into the array
                    var lines=e2.target.result.split('\n');
					if(lines[lines.length-1]=="")lines.pop();
					imageHeight=lines.length;
					for(var i=0;i<lines.length;i++) {
						var values=lines[i].split(' ');
						if(values[values.length-1]=="\r")values.pop();
						if(!imageWidth){
							imageWidth = values.length;
						}else if(imageWidth!=values.length){
							alert('error reading the file. line:'+i+ ", num:"+values.length+", value=("+values[0]+")");
						}
						for(var j=0; j<values.length; j++){
							if(values[j]) image2DArray.push(Number(values[j]));
						}
					}

					
					canvas.style.width=imageWidth+"px";
					canvas.style.height=imageHeight+"px";
					createImageVertices();
					createImageColors();
					//createImageVerticesIndex();
					setView();
					drawScene();
			
                }
                reader.readAsText(file); // start reading the file data.
			}
		}) 
  });
} else { 
  document.getElementById('status').innerHTML = 'Your browser does not support the HTML5 FileReader.';
}
}


function addEventHandler(obj, evt, handler) {
    if(obj.addEventListener) {
        // W3C method
        obj.addEventListener(evt, handler, false);
    } else if(obj.attachEvent) {
        // IE method.
        obj.attachEvent('on'+evt, handler);
    } else {
        // Old school method.
        obj['on'+evt] = handler;
    }
}

